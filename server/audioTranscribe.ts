import { Router } from "express";
import multer from "multer";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, mkdtemp, rm } from "fs/promises";
import { join, extname } from "path";
import { tmpdir } from "os";

const execFileAsync = promisify(execFile);

const MAX_UPLOAD_MB = 500;
const WHISPER_MAX_MB = 24;
const CHUNK_MINUTES = 18;

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
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "quiet", "-print_format", "json", "-show_format", inputPath,
  ]);
  const info = JSON.parse(stdout);
  return parseFloat(info.format.duration ?? "0");
}

async function compressToMp3(inputPath: string, outputPath: string): Promise<void> {
  await execFileAsync("ffmpeg", [
    "-y", "-i", inputPath,
    "-vn",
    "-ar", "16000",
    "-ac", "1",
    "-b:a", "48k",
    outputPath,
  ]);
}

async function extractChunk(inputPath: string, outputPath: string, startSec: number, durationSec: number): Promise<void> {
  await execFileAsync("ffmpeg", [
    "-y",
    "-ss", String(startSec),
    "-i", inputPath,
    "-t", String(durationSec),
    "-vn",
    "-ar", "16000",
    "-ac", "1",
    "-b:a", "48k",
    outputPath,
  ]);
}

async function callWhisper(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key is not configured");

  const base = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL?.replace(/\/$/, "")
    ?? "https://api.openai.com/v1";
  const url = `${base}/audio/transcriptions`;

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: mimeType }), filename);
  form.append("model", "whisper-1");
  form.append("response_format", "text");

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`Whisper API error (${res.status}): ${detail}`);
  }

  return (await res.text()).trim();
}

export function registerAudioTranscribeRoute(app: import("express").Express) {
  const router = Router();

  router.post(
    "/api/transcribe-audio",
    (req: any, res: any, next: any) => {
      upload.single("file")(req, res, (err: any) => {
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
          res.status(413).json({
            error: `File exceeds the ${MAX_UPLOAD_MB}MB upload limit.`,
          });
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

        const { buffer, originalname, mimetype, size } = req.file;
        const sizeMB = size / 1024 / 1024;
        console.log(`[AudioTranscribe] Received ${originalname} (${sizeMB.toFixed(1)}MB)`);

        tmpDir = await mkdtemp(join(tmpdir(), "curalive-audio-"));

        const inputExt = extname(originalname) || ".mp4";
        const inputPath = join(tmpDir, `input${inputExt}`);
        await writeFile(inputPath, buffer);

        const compressedPath = join(tmpDir, "compressed.mp3");
        console.log(`[AudioTranscribe] Compressing audio with ffmpeg...`);
        await compressToMp3(inputPath, compressedPath);

        const compressedBuffer = await readFile(compressedPath);
        const compressedMB = compressedBuffer.length / 1024 / 1024;
        console.log(`[AudioTranscribe] Compressed: ${sizeMB.toFixed(1)}MB → ${compressedMB.toFixed(1)}MB`);

        let transcript: string;

        if (compressedMB <= WHISPER_MAX_MB) {
          console.log(`[AudioTranscribe] Sending to Whisper...`);
          transcript = await callWhisper(compressedBuffer, "recording.mp3", "audio/mpeg");
        } else {
          const totalSecs = await getDurationSeconds(inputPath);
          const chunkSecs = CHUNK_MINUTES * 60;
          const numChunks = Math.ceil(totalSecs / chunkSecs);
          console.log(`[AudioTranscribe] Splitting into ${numChunks} chunks of ${CHUNK_MINUTES} min each...`);

          const parts: string[] = [];
          for (let i = 0; i < numChunks; i++) {
            const startSec = i * chunkSecs;
            const chunkPath = join(tmpDir, `chunk_${i}.mp3`);
            await extractChunk(inputPath, chunkPath, startSec, chunkSecs);
            const chunkBuf = await readFile(chunkPath);
            const chunkMB = chunkBuf.length / 1024 / 1024;
            console.log(`[AudioTranscribe] Transcribing chunk ${i + 1}/${numChunks} (${chunkMB.toFixed(1)}MB)...`);
            const part = await callWhisper(chunkBuf, `chunk_${i}.mp3`, "audio/mpeg");
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
