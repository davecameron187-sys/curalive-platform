// @ts-nocheck
import { Express } from "express";
import multer from "multer";
import { join } from "path";
import { mkdirSync } from "fs";
import { getDb } from "./db";
import { shadowSessions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const RECORDINGS_DIR = join(process.cwd(), "uploads", "recordings");
mkdirSync(RECORDINGS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, RECORDINGS_DIR),
  filename: (_req, file, cb) => {
    const sessionId = _req.params.sessionId || "unknown";
    const ext = file.originalname.includes(".") ? file.originalname.split(".").pop() : "webm";
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

      await db.update(shadowSessions)
        .set({ localRecordingPath: relativePath })
        .where(eq(shadowSessions.id, sessionId));

      console.log(`[Shadow] Recording saved for session ${sessionId}: ${relativePath} (${(req.file.size / 1024 / 1024).toFixed(1)} MB)`);

      res.json({ success: true, path: relativePath, size: req.file.size });
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
        return res.status(404).json({ error: "No recording found" });
      }

      const filePath = join(process.cwd(), session.localRecordingPath);
      res.sendFile(filePath);
    } catch (err) {
      console.error("[Shadow] Recording fetch error:", err);
      res.status(500).json({ error: "Failed to fetch recording" });
    }
  });
}
