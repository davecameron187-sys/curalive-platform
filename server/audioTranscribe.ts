import { Router } from "express";
import multer from "multer";

const MAX_MB = 25;

const ALLOWED_MIMES = [
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav",
  "audio/mp4", "audio/m4a", "audio/x-m4a",
  "video/mp4", "audio/webm", "video/webm", "audio/ogg",
  "audio/flac", "audio/aac",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ALLOWED_MIMES.includes(file.mimetype) ||
      /\.(mp3|mp4|wav|m4a|webm|ogg|flac|aac|mpeg)$/i.test(file.originalname);
    if (ok) cb(null, true);
    else cb(new Error("Audio or video files only (MP3, MP4, WAV, M4A, WebM)"));
  },
});

async function callWhisper(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

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

  const text = await res.text();
  return text.trim();
}

export function registerAudioTranscribeRoute(app: import("express").Express) {
  const router = Router();

  router.post(
    "/api/transcribe-audio",
    (req: any, res: any, next: any) => {
      upload.single("file")(req, res, (err: any) => {
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
          res.status(413).json({
            error: `File too large. Maximum size is ${MAX_MB}MB. Try converting to MP3 at 64kbps — a 90-minute event will compress to under 45MB.`,
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
      try {
        if (!req.file) {
          res.status(400).json({ error: "No audio file provided" });
          return;
        }

        const { buffer, originalname, mimetype, size } = req.file;
        console.log(`[AudioTranscribe] Received ${originalname} (${(size / 1024 / 1024).toFixed(1)}MB), calling Whisper...`);

        const transcript = await callWhisper(buffer, originalname, mimetype);

        console.log(`[AudioTranscribe] Done — ${transcript.split(/\s+/).length} words`);
        res.json({ success: true, transcript });
      } catch (err: any) {
        console.error("[AudioTranscribe]", err);
        res.status(500).json({ error: err.message ?? "Transcription failed" });
      }
    }
  );

  app.use(router);
}
