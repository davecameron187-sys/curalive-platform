/**
 * /api/upload-slide-deck  — multipart file upload endpoint
 * Accepts a PDF or PPTX file, stores it in S3, and returns the public URL.
 * For PDFs we count pages using pdf-parse; for PPTX we return totalSlides=1 (operator can correct).
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import { storagePut } from "./storage";
import { requireAuth } from "./_core/auth";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf" ||
        file.mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
        file.mimetype === "application/vnd.ms-powerpoint" ||
        file.originalname.match(/\.(pdf|pptx|ppt)$/i)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and PowerPoint files are allowed"));
    }
  },
});

async function countPdfPages(buffer: Buffer): Promise<number> {
  try {
    // Quick regex scan — count /Type /Page occurrences in the PDF
    const text = buffer.toString("latin1");
    const matches = text.match(/\/Type\s*\/Page[^s]/g);
    return matches ? matches.length : 1;
  } catch {
    return 1;
  }
}

export function registerSlideDeckUploadRoute(app: import("express").Express) {
  const router = Router();

  router.post(
    "/api/upload-slide-deck",
    async (req: Request, res: Response, next: any) => {
      // Require authenticated session
      try {
        const user = await requireAuth(req);
        if (!user) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }
        next();
      } catch {
        res.status(401).json({ error: "Unauthorized" });
      }
    },
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
        const key = `slide-decks/${Date.now()}-${suffix}-${safeName}`;

        const { url } = await storagePut(key, file.buffer, file.mimetype);

        let totalSlides = 1;
        if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
          totalSlides = await countPdfPages(file.buffer);
        }

        res.json({ url, key, totalSlides, filename: file.originalname });
      } catch (err: any) {
        console.error("[slide-deck-upload]", err);
        res.status(500).json({ error: err.message ?? "Upload failed" });
      }
    }
  );

  app.use(router);
}
