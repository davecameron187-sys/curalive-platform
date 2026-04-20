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

let _ffmpegCached: boolean | null = null;
async function checkFfmpegAvailable(): Promise<boolean> {
  if (_ffmpegCached !== null) return _ffmpegCached;
  try {
    await execFileAsync("ffprobe", ["-version"]);
    _ffmpegCached = true;
  } catch {
    _ffmpegCached = false;
    console.warn("[Audio] ffmpeg/ffprobe not available in this environment");
  }
  return _ffmpegCached;
}

async function getDurationSeconds(inputPath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "quiet", "-print_format", "json", "-show_format", inputPath,
    ]);
    const info = JSON.parse(stdout);
    const duration = parseFloat(info.format?.duration ?? "0");
    if (duration > 0) return duration;
    console.warn("[Audio] ffprobe returned 0 duration — estimating from file size");
    const fs = await import("fs");
    const stat = fs.statSync(inputPath);
    return Math.max(10, Math.round(stat.size / 16000));
  } catch (e: any) {
    console.warn("[Audio] ffprobe failed — estimating duration from file size:", e?.message || e);
    const fs = await import("fs");
    const stat = fs.statSync(inputPath);
    return Math.max(10, Math.round(stat.size / 16000));
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

async function callGeminiTranscribe(buffer: Buffer, filename: string): Promise<string> {
  const geminiBaseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
  const geminiApiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  if (!geminiBaseUrl || !geminiApiKey) {
    throw new Error("GEMINI_NOT_CONFIGURED");
  }

  const ext = (filename.split(".").pop() ?? "mp3").toLowerCase();
  const safeExt = ["mp3", "wav", "m4a", "ogg", "flac", "webm", "mp4"].includes(ext) ? ext : "mp3";
  const mimeType = safeExt === "mp4" ? "video/mp4" : `audio/${safeExt}`;

  const base64Audio = buffer.toString("base64");
  const sizeMB = buffer.length / 1024 / 1024;
  console.log(`[AudioTranscribe] Using Gemini for transcription (${sizeMB.toFixed(1)}MB, ${mimeType})`);

  const url = `${geminiBaseUrl.replace(/\/+$/, "")}/models/gemini-2.5-flash:generateContent`;

  const body = {
    contents: [{
      role: "user",
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Audio,
          },
        },
        {
          text: "Transcribe this audio recording accurately and completely. This is an investor event recording (earnings call, AGM, webcast, etc.). Include all speech verbatim — every word spoken. Preserve speaker names/labels if identifiable. Output only the transcript text, no commentary or analysis. Use proper punctuation and paragraph breaks between different speakers or topics.",
        },
      ],
    }],
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.1,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": geminiApiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    const isQuota = response.status === 429 || response.status === 402
      || errText.includes("QUOTA_EXCEEDED") || errText.includes("RESOURCE_EXHAUSTED")
      || errText.includes("insufficient_quota") || errText.includes("exceeded");
    if (isQuota) {
      throw new Error(`QUOTA_EXCEEDED: Gemini transcription quota exceeded (${response.status})`);
    }
    throw new Error(`Gemini API failed (${response.status}): ${errText}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Gemini returned empty transcript");
  }
  console.log(`[AudioTranscribe] Gemini transcription complete — ${trimmed.split(/\s+/).filter(Boolean).length} words`);
  return trimmed;
}

async function callWhisperTranscribe(buffer: Buffer, filename: string): Promise<string> {
  const hasIntegrationKey = !!(process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_API_KEY.trim());
  const hasDirectKey = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim());
  let apiKey: string;
  let baseUrl: string;

  if (hasIntegrationKey) {
    apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY!.trim();
    baseUrl = (process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? "https://api.openai.com").replace(/\/+$/, "");
  } else if (hasDirectKey) {
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

  const { default: OpenAI, toFile } = await import("openai");
  const client = new OpenAI({ apiKey, baseURL: `${baseUrl}/v1` });

  console.log(`[AudioTranscribe] Sending ${(buffer.length / 1024 / 1024).toFixed(1)}MB to Whisper API at ${baseUrl} (key: ${apiKey.slice(0, 8)}...) via SDK toFile`);

  const file = await toFile(buffer, `audio.${safeExt}`, { type: mimeType });

  let result: any;
  try {
    result = await client.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "verbose_json",
      prompt: "Transcribe this investor event recording accurately, including speaker names and financial terminology.",
    });
  } catch (err: any) {
    const status = err?.status ?? err?.statusCode ?? 0;
    const errText = err?.message ?? String(err);
    const isQuota = status === 429 || status === 402
      || errText.includes("insufficient_quota") || errText.includes("exceeded your current quota")
      || errText.includes("QUOTA_EXCEEDED") || errText.includes("billing");
    if (isQuota) {
      throw new Error(`QUOTA_EXCEEDED: The AI transcription service has reached its usage limit. The recording has been saved and you can retry transcription later.`);
    }
    throw new Error(`Whisper API failed (${status}): ${errText}`);
  }

  return (result.text ?? "").trim();
}

async function callTranscribeApi(buffer: Buffer, filename: string): Promise<string> {
  const geminiConfigured = !!(process.env.AI_INTEGRATIONS_GEMINI_BASE_URL && process.env.AI_INTEGRATIONS_GEMINI_API_KEY);

  if (geminiConfigured) {
    try {
      return await callGeminiTranscribe(buffer, filename);
    } catch (geminiErr: any) {
      const isQuota = geminiErr.message?.includes("QUOTA_EXCEEDED");
      console.warn(`[AudioTranscribe] Gemini transcription failed${isQuota ? " (quota)" : ""}: ${geminiErr.message?.substring(0, 100)}`);
      if (isQuota) {
        console.log("[AudioTranscribe] Falling back to Whisper API...");
      } else {
        console.log("[AudioTranscribe] Falling back to Whisper API...");
      }
    }
  }

  return await callWhisperTranscribe(buffer, filename);
}

export function registerAudioTranscribeRoute(app: import("express").Express) {
  const router = Router();

  router.post(
    "/api/transcribe-audio",
    (req: any, res: any, next: any) => {
      console.log(`[AudioTranscribe] Incoming request — content-type: ${req.headers["content-type"]?.slice(0, 80)}`);
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
      let savedRecordingPath: string | null = null;
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

        try {
          const path = await import("path");
          const fs = await import("fs");
          const crypto = await import("crypto");
          const RECORDINGS_DIR = path.resolve(process.cwd(), "uploads", "recordings");
          if (!fs.existsSync(RECORDINGS_DIR)) fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
          const rawExt = (path.extname(originalname) || ".mp3").toLowerCase();
          const safeExt = /^\.(mp3|mp4|wav|m4a|webm|ogg|flac|aac)$/.test(rawExt) ? rawExt : ".mp3";
          const uniqueName = `${Date.now()}_${crypto.randomBytes(6).toString("hex")}${safeExt}`;
          const destPath = path.join(RECORDINGS_DIR, uniqueName);
          await writeFile(destPath, buffer);
          savedRecordingPath = uniqueName;
          console.log(`[AudioTranscribe] Saved recording: ${uniqueName} (${sizeMB.toFixed(1)}MB)`);
        } catch (saveErr: any) {
          console.error("[AudioTranscribe] Failed to save recording copy:", saveErr.message);
        }

        let transcript: string;

        const ffmpegAvailable = await checkFfmpegAvailable();

        if (sizeMB <= DIRECT_MAX_MB) {
          console.log(`[AudioTranscribe] Small file (${sizeMB.toFixed(1)}MB), sending directly to Whisper API...`);
          transcript = await callTranscribeApi(buffer, originalname);
        } else if (!ffmpegAvailable) {
          console.warn(`[AudioTranscribe] ffmpeg not available — sending file directly to Whisper API (${sizeMB.toFixed(1)}MB)`);
          if (sizeMB > 24) {
            throw new Error("File is too large to process without ffmpeg. Maximum 24MB without audio processing tools.");
          }
          transcript = await callTranscribeApi(buffer, originalname);
        } else {
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

        res.json({ success: true, transcript, savedRecordingPath });
      } catch (err: any) {
        console.error("[AudioTranscribe]", err);
        const isQuotaError = err.message?.includes("QUOTA_EXCEEDED") || err.message?.includes("429") || err.message?.includes("insufficient_quota");
        if (isQuotaError && savedRecordingPath) {
          res.status(200).json({
            success: true,
            transcript: "",
            savedRecordingPath,
            transcriptionStatus: "quota_exceeded",
            transcriptionError: "AI transcription quota exceeded. Your recording has been saved — you can retry transcription later.",
          });
        } else {
          const statusCode = isQuotaError ? 429 : 500;
          const errorMessage = isQuotaError
            ? "AI transcription quota exceeded. Your recording has been saved — you can retry transcription later from the archive."
            : (err.message ?? "Transcription failed");
          res.status(statusCode).json({ error: errorMessage, code: isQuotaError ? "QUOTA_EXCEEDED" : "TRANSCRIPTION_FAILED", savedRecordingPath });
        }
      } finally {
        if (tmpDir) {
          rm(tmpDir, { recursive: true, force: true }).catch(() => {});
        }
      }
    }
  );

  app.use(router);
}
