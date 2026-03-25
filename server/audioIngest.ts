/**
 * audioIngest.ts — Live Audio Ingest Worker
 *
 * Architecture:
 *   1. ffmpeg pulls the Mux HLS stream (https://stream.mux.com/{playbackId}.m3u8)
 *   2. Audio is extracted as raw PCM and segmented into 5-second WAV chunks
 *   3. Each chunk is uploaded to S3 via storagePut()
 *   4. The S3 URL is sent to Whisper via transcribeAudio()
 *   5. The transcript segment is published to the Ably channel for the event
 *      using the Ably REST API (same pattern as recallWebhook.ts)
 *
 * Worker lifecycle:
 *   - startIngest(streamId, hlsUrl, ablyChannel) → spawns ffmpeg, returns worker
 *   - stopIngest(streamId) → kills ffmpeg process, cleans up temp files
 *   - getIngestStatus(streamId) → returns running/stopped/error state
 *
 * In-process worker map (Map<streamId, IngestWorker>) persists across requests
 * for the lifetime of the Node.js process. On server restart, workers are
 * automatically stopped (ffmpeg processes are killed with the process).
 */

import { spawn, ChildProcess } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { transcribeAudio, type TranscriptionError } from "./_core/voiceTranscription";
import { storagePut } from "./storage";

// Type guard to distinguish successful transcription from error
function isTranscriptionError(r: unknown): r is TranscriptionError {
  return typeof r === "object" && r !== null && "error" in r;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type IngestStatus = "running" | "stopped" | "error";

export interface IngestWorker {
  streamId: string;
  hlsUrl: string;
  ablyChannel: string;
  status: IngestStatus;
  startedAt: Date;
  stoppedAt?: Date;
  errorMessage?: string;
  segmentsProcessed: number;
  ffmpegProcess: ChildProcess | null;
  chunkDir: string;
}

// ─── In-process worker registry ───────────────────────────────────────────────

const workers = new Map<string, IngestWorker>();

// ─── Ably REST publish (same pattern as recallWebhook.ts) ─────────────────────

const ABLY_REST_URL = "https://rest.ably.io";

async function ablyPublish(channel: string, name: string, data: unknown) {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) return;
  const url = `${ABLY_REST_URL}/channels/${encodeURIComponent(channel)}/messages`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(apiKey).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, data }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn(`[Ably] Publish failed ${res.status}: ${text}`);
    }
  } catch (err) {
    console.warn("[Ably] Publish error:", err);
  }
}

// ─── Chunk processor ─────────────────────────────────────────────────────────

/**
 * Process a single WAV chunk file:
 *   1. Upload to S3
 *   2. Transcribe via Whisper
 *   3. Publish transcript segment to Ably
 *   4. Delete the local temp file
 */
async function processChunk(
  chunkPath: string,
  worker: IngestWorker,
  chunkIndex: number
): Promise<void> {
  try {
    // 1. Read the WAV file
    const wavBuffer = await fs.readFile(chunkPath);
    if (wavBuffer.length < 1000) {
      // Skip near-empty chunks (silence / partial segments)
      await fs.unlink(chunkPath).catch(() => {});
      return;
    }

    // 2. Upload to S3 for Whisper (Whisper requires a URL, not raw bytes)
    const s3Key = `audio-ingest/${worker.streamId}/chunk-${chunkIndex}-${Date.now()}.wav`;
    const { url: audioUrl } = await storagePut(s3Key, wavBuffer, "audio/wav");

    // 3. Transcribe via Whisper
    const rawResult = await transcribeAudio({
      audioUrl,
      language: "en",
      prompt: "Live event transcription. Speaker is presenting to investors.",
    });

    // Narrow the union type — skip if transcription failed
    if (isTranscriptionError(rawResult)) {
      console.warn(`[AudioIngest] Transcription error for chunk ${chunkIndex}:`, rawResult.error);
      await fs.unlink(chunkPath).catch(() => {});
      return;
    }

    const transcribedText = rawResult.text?.trim();
    if (!transcribedText) {
      await fs.unlink(chunkPath).catch(() => {});
      return;
    }

    // 4. Publish transcript segment to Ably
    const segment = {
      id: `rtmp-${worker.streamId}-${chunkIndex}`,
      speaker: "Presenter",
      text: transcribedText,
      timestamp: new Date().toISOString(),
      confidence: 0.95,
      source: "rtmp",
    };

    await ablyPublish(
      worker.ablyChannel,
      "curalive",
      JSON.stringify({
        type: "transcript.segment",
        data: segment,
      })
    );

    worker.segmentsProcessed++;
    console.log(
      `[AudioIngest] ${worker.streamId} chunk ${chunkIndex}: "${transcribedText.slice(0, 60)}..."`
    );

    // 5. Clean up temp file
    await fs.unlink(chunkPath).catch(() => {});
  } catch (err) {
    console.error(`[AudioIngest] Error processing chunk ${chunkIndex}:`, err);
    await fs.unlink(chunkPath).catch(() => {});
  }
}

// ─── Chunk watcher ────────────────────────────────────────────────────────────

/**
 * Watch the chunk directory for new WAV files and process them as they appear.
 * Uses a polling interval rather than fs.watch() for reliability across platforms.
 */
function startChunkWatcher(worker: IngestWorker): NodeJS.Timeout {
  const processedChunks = new Set<string>();
  let chunkIndex = 0;

  const interval = setInterval(async () => {
    if (worker.status !== "running") {
      clearInterval(interval);
      return;
    }

    try {
      const files = await fs.readdir(worker.chunkDir);
      // Sort by name (chunk_000.wav, chunk_001.wav, ...) to process in order
      const wavFiles = files
        .filter((f) => f.endsWith(".wav") && !processedChunks.has(f))
        .sort();

      for (const file of wavFiles) {
        // Skip the most recent file — ffmpeg may still be writing to it
        if (file === wavFiles[wavFiles.length - 1]) continue;

        processedChunks.add(file);
        const chunkPath = path.join(worker.chunkDir, file);
        await processChunk(chunkPath, worker, chunkIndex++);
      }
    } catch (err) {
      // Directory may not exist yet — ignore
    }
  }, 2000); // Poll every 2 seconds

  return interval;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Start an audio ingest worker for a Mux live stream.
 *
 * @param streamId    Unique identifier for the stream (mux_streams.id)
 * @param hlsUrl      Mux HLS URL: https://stream.mux.com/{playbackId}.m3u8
 * @param ablyChannel Ably channel name for the event (e.g. "curalive-event-q4-earnings-2026")
 */
export async function startIngest(
  streamId: string,
  hlsUrl: string,
  ablyChannel: string
): Promise<IngestWorker> {
  // Stop any existing worker for this stream
  await stopIngest(streamId);

  // Create a temp directory for WAV chunks
  const chunkDir = path.join(os.tmpdir(), `curalive-ingest-${streamId}`);
  await fs.mkdir(chunkDir, { recursive: true });

  const worker: IngestWorker = {
    streamId,
    hlsUrl,
    ablyChannel,
    status: "running",
    startedAt: new Date(),
    segmentsProcessed: 0,
    ffmpegProcess: null,
    chunkDir,
  };

  workers.set(streamId, worker);

  // Spawn ffmpeg to pull HLS audio and segment into 5-second WAV chunks
  //
  // Command breakdown:
  //   -i {hlsUrl}           Pull from Mux HLS stream
  //   -vn                   No video
  //   -acodec pcm_s16le     PCM 16-bit little-endian (Whisper-compatible)
  //   -ar 16000             16 kHz sample rate (Whisper optimal)
  //   -ac 1                 Mono channel
  //   -f segment            Segment muxer
  //   -segment_time 5       5-second chunks
  //   -segment_format wav   Output as WAV files
  //   chunk_%03d.wav        Output filename pattern
  const ffmpegArgs = [
    "-re",                          // Read input at native frame rate
    "-i", hlsUrl,                   // Mux HLS input
    "-vn",                          // Skip video
    "-acodec", "pcm_s16le",         // PCM audio codec
    "-ar", "16000",                 // 16 kHz sample rate
    "-ac", "1",                     // Mono
    "-f", "segment",                // Segment muxer
    "-segment_time", "5",           // 5-second chunks
    "-segment_format", "wav",       // WAV output
    "-reset_timestamps", "1",       // Reset timestamps per segment
    path.join(chunkDir, "chunk_%03d.wav"),
  ];

  console.log(`[AudioIngest] Starting ffmpeg for stream ${streamId}`);
  console.log(`[AudioIngest] HLS URL: ${hlsUrl}`);
  console.log(`[AudioIngest] Ably channel: ${ablyChannel}`);

  const ffmpegProcess = spawn("ffmpeg", ffmpegArgs, {
    stdio: ["ignore", "pipe", "pipe"],
  });

  worker.ffmpegProcess = ffmpegProcess;

  ffmpegProcess.stderr?.on("data", (data: Buffer) => {
    const msg = data.toString();
    // Only log meaningful ffmpeg output (not the progress lines)
    if (msg.includes("Error") || msg.includes("error") || msg.includes("Opening")) {
      console.log(`[ffmpeg:${streamId}]`, msg.trim().slice(0, 200));
    }
  });

  ffmpegProcess.on("exit", (code, signal) => {
    console.log(`[AudioIngest] ffmpeg exited for ${streamId}: code=${code} signal=${signal}`);
    if (worker.status === "running") {
      worker.status = code === 0 ? "stopped" : "error";
      worker.stoppedAt = new Date();
      if (code !== 0 && signal !== "SIGTERM") {
        worker.errorMessage = `ffmpeg exited with code ${code}`;
      }
    }
  });

  ffmpegProcess.on("error", (err) => {
    console.error(`[AudioIngest] ffmpeg spawn error for ${streamId}:`, err);
    worker.status = "error";
    worker.errorMessage = err.message;
    worker.stoppedAt = new Date();
  });

  // Start the chunk watcher
  startChunkWatcher(worker);

  return worker;
}

/**
 * Stop an audio ingest worker and clean up temp files.
 */
export async function stopIngest(streamId: string): Promise<void> {
  const worker = workers.get(streamId);
  if (!worker) return;

  console.log(`[AudioIngest] Stopping ingest for stream ${streamId}`);

  worker.status = "stopped";
  worker.stoppedAt = new Date();

  if (worker.ffmpegProcess) {
    worker.ffmpegProcess.kill("SIGTERM");
    worker.ffmpegProcess = null;
  }

  // Clean up temp directory
  try {
    await fs.rm(worker.chunkDir, { recursive: true, force: true });
  } catch (err) {
    console.warn(`[AudioIngest] Failed to clean up chunk dir:`, err);
  }

  workers.delete(streamId);
}

/**
 * Get the current status of an ingest worker.
 */
export function getIngestStatus(streamId: string): IngestWorker | null {
  return workers.get(streamId) ?? null;
}

/**
 * List all active ingest workers.
 */
export function listActiveIngests(): IngestWorker[] {
  return Array.from(workers.values()).filter((w) => w.status === "running");
}

/**
 * Stop all active ingest workers (called on server shutdown).
 */
export async function stopAllIngests(): Promise<void> {
  const ids = Array.from(workers.keys());
  await Promise.all(ids.map((id) => stopIngest(id)));
}
