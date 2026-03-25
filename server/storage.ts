import { Storage } from "@google-cloud/storage";

const BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
const PRIVATE_DIR = process.env.PRIVATE_OBJECT_DIR || "uploads";

let _storage: Storage | null = null;

function getStorage(): Storage {
  if (!_storage) {
    _storage = new Storage();
  }
  return _storage;
}

function getBucket() {
  if (!BUCKET_ID) {
    throw new Error("Object storage not configured: DEFAULT_OBJECT_STORAGE_BUCKET_ID is missing");
  }
  return getStorage().bucket(BUCKET_ID);
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = `${PRIVATE_DIR}/${normalizeKey(relKey)}`;
  const bucket = getBucket();
  const file = bucket.file(key);

  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);

  await file.save(buffer, {
    contentType,
    resumable: false,
  });

  const [signedUrl] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  return { key, url: signedUrl };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = `${PRIVATE_DIR}/${normalizeKey(relKey)}`;
  const bucket = getBucket();
  const file = bucket.file(key);

  const [signedUrl] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  return { key, url: signedUrl };
}

export async function storageDelete(relKey: string): Promise<void> {
  const key = `${PRIVATE_DIR}/${normalizeKey(relKey)}`;
  const bucket = getBucket();
  const file = bucket.file(key);

  try {
    await file.delete();
  } catch (err: any) {
    if (err?.code !== 404) throw err;
  }
}

export async function storageExists(relKey: string): Promise<boolean> {
  const key = `${PRIVATE_DIR}/${normalizeKey(relKey)}`;
  const bucket = getBucket();
  const file = bucket.file(key);

  const [exists] = await file.exists();
  return exists;
}
