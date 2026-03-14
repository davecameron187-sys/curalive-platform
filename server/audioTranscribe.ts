import { Router } from "express";
import multer from "multer";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, mkdtemp, rm } from "fs/promises";
import { join, extname } from "path";
import { tmpdir } from "os";
import { openai } from "./replit_integrations/audio/client";
import { toFile } from "openai";

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
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "quiet", "-print_format", "json", "-show_format", inputPath,
  ]);
  const info = JSON.parse(stdout);
  return parseFloat(info.format.duration ?? "0");
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
  const ext = (filename.split(".").pop() ?? "mp3").toLowerCase();
  const safeExt = ["mp3", "wav", "m4a", "ogg", "flac", "webm"].includes(ext) ? ext : "mp3";
  const file = await toFile(buffer, `audio.${safeExt}`);
  const response = await openai.audio.transcriptions.create({
    file,
    model: "gpt-4o-mini-transcribe",
  });
  return response.text.trim();
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
