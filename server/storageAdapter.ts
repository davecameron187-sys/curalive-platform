import { existsSync, statSync, readdirSync, accessSync, constants, writeFileSync, readFileSync, mkdirSync, unlinkSync, createReadStream } from "fs";
import { join, basename, resolve, normalize, extname } from "path";
import { storagePut, storageGet } from "./storage";
import { ENV } from "./_core/env";

const RECORDINGS_DIR = resolve(process.cwd(), "uploads", "recordings");

export type FileResolution = {
  found: boolean;
  source: "object-storage" | "local-disk" | "none";
  localPath?: string;
  url?: string;
  sizeBytes?: number;
};

export type StorageHealth = {
  localDiskWritable: boolean;
  objectStorageConfigured: boolean;
  localRecordingsCount: number;
  localRecordingsTotalBytes: number;
};

function isObjectStorageConfigured(): boolean {
  return Boolean(ENV.forgeApiUrl && ENV.forgeApiKey);
}

function sanitizeBasename(rawPath: string): string {
  return basename(rawPath).replace(/[^a-zA-Z0-9._\-]/g, "_");
}

function isWithinDir(filePath: string, baseDir: string): boolean {
  const resolved = resolve(filePath);
  const normalised = normalize(resolved);
  return normalised.startsWith(normalize(baseDir) + "/") || normalised === normalize(baseDir);
}

export async function resolveRecordingFile(recordingPath: string | null | undefined): Promise<FileResolution> {
  if (!recordingPath || !recordingPath.trim()) {
    return { found: false, source: "none" };
  }

  const safeName = sanitizeBasename(recordingPath);

  if (isObjectStorageConfigured()) {
    const storageKey = `recordings/${safeName}`;
    try {
      const result = await storageGet(storageKey);
      if (result.url) {
        return { found: true, source: "object-storage", url: result.url };
      }
    } catch {}
  }

  const localPath = resolve(RECORDINGS_DIR, safeName);
  if (!isWithinDir(localPath, RECORDINGS_DIR)) {
    return { found: false, source: "none" };
  }

  if (existsSync(localPath)) {
    try {
      const stats = statSync(localPath);
      return { found: true, source: "local-disk", localPath, sizeBytes: stats.size };
    } catch {
      return { found: false, source: "none" };
    }
  }

  return { found: false, source: "none" };
}

export async function persistToObjectStorage(
  localPath: string,
  storageKey: string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string } | null> {
  if (!isObjectStorageConfigured()) {
    return null;
  }

  if (!existsSync(localPath)) {
    return null;
  }

  try {
    const chunks: Buffer[] = [];
    const stream = createReadStream(localPath);
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const data = Buffer.concat(chunks);
    const result = await storagePut(storageKey, data, contentType);
    console.log(`[StorageAdapter] Persisted ${basename(localPath)} → ${storageKey}`);
    return result;
  } catch (err) {
    console.warn(`[StorageAdapter] Failed to persist ${basename(localPath)} to object storage:`, err instanceof Error ? err.message : err);
    return null;
  }
}

export function getStorageHealth(): StorageHealth {
  let localDiskWritable = false;
  try {
    mkdirSync(RECORDINGS_DIR, { recursive: true });
    const testFile = join(RECORDINGS_DIR, ".write-test");
    writeFileSync(testFile, "ok");
    accessSync(testFile, constants.W_OK);
    unlinkSync(testFile);
    localDiskWritable = true;
  } catch {
    localDiskWritable = false;
  }

  let localRecordingsCount = 0;
  let localRecordingsTotalBytes = 0;
  try {
    const files = readdirSync(RECORDINGS_DIR).filter(f => !f.startsWith("."));
    localRecordingsCount = files.length;
    for (const f of files) {
      try {
        localRecordingsTotalBytes += statSync(join(RECORDINGS_DIR, f)).size;
      } catch {}
    }
  } catch {}

  return {
    localDiskWritable,
    objectStorageConfigured: isObjectStorageConfigured(),
    localRecordingsCount,
    localRecordingsTotalBytes,
  };
}

export { RECORDINGS_DIR, sanitizeBasename, isWithinDir, isObjectStorageConfigured };
