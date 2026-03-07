/**
 * /api/upload-audio — multipart file upload for OCC audio library.
 * Accepts MP3 / WAV / OGG files, stores via storagePut, returns public URL.
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import { storagePut } from "./storage";

const ALLOWED_MIME = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/ogg",
  "audio/webm",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype) || file.originalname.match(/\.(mp3|wav|ogg|webm)$/i)) {
      cb(null, true);
    } else {
      cb(new Error("Only MP3, WAV, OGG, or WebM audio files are allowed"));
    }
  },
});

export function registerAudioUploadRoute(app: import("express").Express) {
  const router = Router();

  router.post(
    "/api/upload-audio",
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        const file = (req as any).file;
        if (!file) {
          res.status(400).json({ error: "No file provided" });
          return;
        }

        const suffix = Math.random().toString(36).slice(2, 8);
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        const key = `occ-audio/${Date.now()}-${suffix}-${safeName}`;

        const { url } = await storagePut(key, file.buffer, file.mimetype);

        res.json({ url, key, filename: file.originalname });
      } catch (err: any) {
        console.error("[audio-upload]", err);
        res.status(500).json({ error: err.message ?? "Upload failed" });
      }
    }
  );

  app.use(router);
}
