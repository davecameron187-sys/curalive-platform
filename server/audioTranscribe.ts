// @ts-nocheck
import { Router } from "express";
import multer from "multer";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, mkdtemp, rm } from "fs/promises";
import { join, extname } from "path";
import { tmpdir } from "os";
// Whisper transcription — sends audio buffer directly to OpenAI API

const execFileAsync = promisify(execFile);

const MAX_UPLOAD_MB = 500;
const DIRECT_MAX_MB = 10;       // Files under this go straight to API, no ffmpeg
const CHUNK_MINUTES = 8;         // 8 min × 32kbps = ~1.9MB per chunk — safely under any proxy limit
const CHUNK_BITRATE = "32k";

const AUDIO_EXTENSIONS = /\.(mp3|wav|m4a|ogg|flac|aac|mpeg)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|avi|mkv)$/i;

const ALLOWED_MIMES = [
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav",
  "audio/mp4", "audio/m4a", "audio/x-m4a",
  "video/mp4", "audio/webm", "video/webm", "audio/ogg",
  "audio/flac", "audio/aac",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ALLOWED_MIMES.includes(file.mimetype) ||
      /\.(mp3|mp4|wav|m4a|webm|ogg|flac|aac|mpeg)$/i.test(file.originalname);
    if (ok) cb(null, true);
    else cb(new Error("Audio or video files only (MP3, MP4, WAV, M4A, WebM)"));
  },
});

async function getDurationSeconds(inputPath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "quiet", "-print_format", "json", "-show_format", inputPath,
    ]);
    const info = JSON.parse(stdout);
    return parseFloat(info.format.duration ?? "0");
  } catch (e: any) {
    if (e?.code === "ENOENT") {
      console.warn("[Audio] ffprobe not found — estimating duration from file size");
      const fs = await import("fs");
      const stat = fs.statSync(inputPath);
      return Math.max(60, Math.round(stat.size / 16000));
    }
    throw e;
  }
}

async function extractChunkMp3(
  inputPath: string,
  outputPath: string,
  startSec: number,
  durationSec: number
): Promise<void> {
  await execFileAsync("ffmpeg", [
    "-y",
    "-ss", String(startSec),
    "-i", inputPath,
    "-t", String(durationSec),
    "-vn",
    "-ar", "16000",
    "-ac", "1",
    "-b:a", CHUNK_BITRATE,
    "-codec:a", "libmp3lame",
    outputPath,
  ]);
}

async function callTranscribeApi(buffer: Buffer, filename: string): Promise<string> {
  const hasDirectKey = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim());
  let apiKey: string;
  let baseUrl: string;

  if (hasDirectKey) {
    apiKey = process.env.OPENAI_API_KEY!.trim();
    baseUrl = "https://api.openai.com";
  } else if (process.env.BUILT_IN_FORGE_API_KEY && process.env.BUILT_IN_FORGE_API_URL) {
    apiKey = process.env.BUILT_IN_FORGE_API_KEY;
    baseUrl = process.env.BUILT_IN_FORGE_API_URL.replace(/\/+$/, "");
  } else {
    throw new Error("No OpenAI API key configured for transcription");
  }

  const ext = (filename.split(".").pop() ?? "mp3").toLowerCase();
  const safeExt = ["mp3", "wav", "m4a", "ogg", "flac", "webm", "mp4"].includes(ext) ? ext : "mp3";
  const mimeType = safeExt === "mp4" ? "video/mp4" : `audio/${safeExt}`;

  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
  const formData = new FormData();
  formData.append("file", blob, `audio.${safeExt}`);
  formData.append("model", "whisper-1");
  formData.append("response_format", "verbose_json");
  formData.append("prompt", "Transcribe this investor event recording accurately, including speaker names and financial terminology.");

  const url = `${baseUrl}/v1/audio/transcriptions`;
  console.log(`[AudioTranscribe] Sending ${(buffer.length / 1024 / 1024).toFixed(1)}MB directly to Whisper API...`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Accept-Encoding": "identity",
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`Whisper API failed (${response.status}): ${errText}`);
  }

  const result = await response.json();
  return (result.text ?? "").trim();
}

export function registerAudioTranscribeRoute(app: import("express").Express) {
  const router = Router();

  router.post(
    "/api/transcribe-audio",
    (req: any, res: any, next: any) => {
      upload.single("file")(req, res, (err: any) => {
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
          res.status(413).json({ error: `File exceeds the ${MAX_UPLOAD_MB}MB upload limit.` });
          return;
        }
        if (err) {
          res.status(400).json({ error: err.message });
          return;
        }
        next();
      });
    },
    async (req: any, res: any) => {
      let tmpDir: string | null = null;
      try {
        if (!req.file) {
          res.status(400).json({ error: "No audio file provided" });
          return;
        }

        const { buffer, originalname, size } = req.file;
        const sizeMB = size / 1024 / 1024;
        const isVideo = VIDEO_EXTENSIONS.test(originalname);
        const isAudio = AUDIO_EXTENSIONS.test(originalname);
        console.log(`[AudioTranscribe] Received ${originalname} (${sizeMB.toFixed(1)}MB, video=${isVideo})`);

        let transcript: string;

        if (isAudio && !isVideo && sizeMB <= DIRECT_MAX_MB) {
          // Small audio file — send directly, no processing needed
          console.log(`[AudioTranscribe] Small audio file, sending directly to API...`);
          transcript = await callTranscribeApi(buffer, originalname);
        } else {
          // Large audio or video — chunk into small MP3 segments with ffmpeg
          tmpDir = await mkdtemp(join(tmpdir(), "curalive-audio-"));
          const inputExt = extname(originalname) || (isVideo ? ".mp4" : ".mp3");
          const inputPath = join(tmpDir, `input${inputExt}`);
          await writeFile(inputPath, buffer);

          const totalSecs = await getDurationSeconds(inputPath);
          const chunkSecs = CHUNK_MINUTES * 60;
          const numChunks = Math.ceil(totalSecs / chunkSecs);

          console.log(`[AudioTranscribe] Duration: ${(totalSecs / 60).toFixed(1)} min → ${numChunks} chunks of ${CHUNK_MINUTES} min at ${CHUNK_BITRATE}`);

          const parts: string[] = [];
          for (let i = 0; i < numChunks; i++) {
            const startSec = i * chunkSecs;
            const chunkPath = join(tmpDir, `chunk_${i}.mp3`);
            await extractChunkMp3(inputPath, chunkPath, startSec, chunkSecs);
            const chunkBuf = await readFile(chunkPath);
            const chunkMB = chunkBuf.length / 1024 / 1024;
            console.log(`[AudioTranscribe] Chunk ${i + 1}/${numChunks}: ${chunkMB.toFixed(1)}MB — sending to API...`);
            const part = await callTranscribeApi(chunkBuf, `chunk_${i}.mp3`);
            parts.push(part);
          }
          transcript = parts.join("\n\n");
        }

        const wordCount = transcript.split(/\s+/).filter(Boolean).length;
        console.log(`[AudioTranscribe] Complete — ${wordCount} words`);
        res.json({ success: true, transcript });
      } catch (err: any) {
        console.error("[AudioTranscribe]", err);
        res.status(500).json({ error: err.message ?? "Transcription failed" });
      } finally {
        if (tmpDir) {
          rm(tmpDir, { recursive: true, force: true }).catch(() => {});
        }
      }
    }
  );

  app.use(router);
}
