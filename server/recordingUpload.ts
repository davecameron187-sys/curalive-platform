// @ts-nocheck
import { Express } from "express";
import multer from "multer";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";
import { getDb } from "./db";
import { shadowSessions } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { RECORDINGS_DIR, resolveRecordingFile, persistToObjectStorage } from "./storageAdapter";

mkdirSync(RECORDINGS_DIR, { recursive: true });

const ALLOWED_EXTENSIONS = new Set(["webm", "mp4", "ogg", "wav", "mp3", "m4a", "aac", "flac"]);

function sanitizeExtension(originalname: string): string {
  if (!originalname || !originalname.includes(".")) return "webm";
  const raw = originalname.split(".").pop() || "webm";
  const cleaned = raw.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return ALLOWED_EXTENSIONS.has(cleaned) ? cleaned : "webm";
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, RECORDINGS_DIR),
  filename: (_req, file, cb) => {
    const sessionId = (_req.params.sessionId || "unknown").replace(/[^a-zA-Z0-9_\-]/g, "");
    const ext = sanitizeExtension(file.originalname);
    cb(null, `shadow-${sessionId}-${Date.now()}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype.startsWith("audio/") || file.mimetype.startsWith("video/");
    if (ok) cb(null, true);
    else cb(new Error("Audio or video files only"));
  },
});

export function registerRecordingUploadRoute(app: Express) {
  app.post("/api/shadow/recording/:sessionId", upload.single("recording"), async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId, 10);
      if (isNaN(sessionId)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No recording file provided" });
      }

      const db = await getDb();
      const relativePath = `uploads/recordings/${req.file.filename}`;
      const fullPath = join(RECORDINGS_DIR, req.file.filename);

      await db.update(shadowSessions)
        .set({ localRecordingPath: relativePath })
        .where(eq(shadowSessions.id, sessionId));

      const sizeMB = (req.file.size / 1024 / 1024).toFixed(1);
      console.log(`[Shadow] Recording saved locally for session ${sessionId}: ${relativePath} (${sizeMB} MB)`);

      persistToObjectStorage(fullPath, `recordings/${req.file.filename}`, req.file.mimetype)
        .then(result => {
          if (result) {
            console.log(`[Shadow] Recording also persisted to object storage: ${result.key}`);
          }
        })
        .catch(() => {});

      res.json({
        success: true,
        path: relativePath,
        size: req.file.size,
        mimetype: req.file.mimetype,
        filename: req.file.filename,
      });
    } catch (err) {
      console.error("[Shadow] Recording upload error:", err);
      res.status(500).json({ error: "Failed to save recording" });
    }
  });

  app.get("/api/shadow/recording/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId, 10);
      if (isNaN(sessionId)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }

      const db = await getDb();
      const [session] = await db
        .select()
        .from(shadowSessions)
        .where(eq(shadowSessions.id, sessionId))
        .limit(1);

      if (!session || !session.localRecordingPath) {
        return res.status(404).json({ error: "No recording found for this session" });
      }

      const resolution = await resolveRecordingFile(session.localRecordingPath);

      if (!resolution.found) {
        return res.status(404).json({
          error: "Recording file not found. It may have been lost during a server restart.",
          sessionId,
        });
      }

      if (resolution.source === "object-storage" && resolution.url) {
        return res.redirect(302, resolution.url);
      }

      if (resolution.localPath && existsSync(resolution.localPath)) {
        return res.sendFile(resolution.localPath);
      }

      res.status(404).json({ error: "Recording path resolved but file unavailable" });
    } catch (err) {
      console.error("[Shadow] Recording fetch error:", err);
      res.status(500).json({ error: "Failed to fetch recording" });
    }
  });
}
