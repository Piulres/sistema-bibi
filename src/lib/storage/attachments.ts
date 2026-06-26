import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const BLOB_STORE = "bibi-attachments";
const LOCAL_DIR = join(process.cwd(), "public", "attachments");
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.dwg",
  "application/acad",
  "application/octet-stream",
]);

export function isAllowedAttachmentType(contentType: string): boolean {
  return ALLOWED_TYPES.has(contentType);
}

export function attachmentMaxBytes(): number {
  return MAX_BYTES;
}

function localPath(blobKey: string): string {
  const safe = blobKey.replace(/[^a-zA-Z0-9/_-]/g, "_");
  return join(LOCAL_DIR, safe);
}

function localMetaPath(blobKey: string): string {
  return `${localPath(blobKey)}.meta.json`;
}

async function saveToBlob(
  blobKey: string,
  buffer: Buffer,
  contentType: string,
): Promise<boolean> {
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: BLOB_STORE, consistency: "strong" });
    const arrayBuffer = new ArrayBuffer(buffer.length);
    new Uint8Array(arrayBuffer).set(buffer);
    await store.set(blobKey, arrayBuffer, { metadata: { contentType } });
    return true;
  } catch {
    return false;
  }
}

async function readFromBlob(
  blobKey: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: BLOB_STORE });
    const result = await store.getWithMetadata(blobKey, { type: "arrayBuffer" });
    if (!result) return null;
    return {
      buffer: Buffer.from(result.data as ArrayBuffer),
      contentType: (result.metadata?.contentType as string | undefined) ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}

export function buildAttachmentBlobKey(
  tenantId: string,
  entityType: string,
  entityId: string,
  attachmentId: string,
): string {
  return `attachments/${tenantId}/${entityType}/${entityId}/${attachmentId}`;
}

/** Persiste bytes do anexo e retorna a blobKey. */
export async function saveAttachmentFile(
  blobKey: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  if (buffer.length > MAX_BYTES) {
    throw new Error(`Arquivo excede o limite de ${MAX_BYTES / 1024 / 1024} MB`);
  }
  if (!isAllowedAttachmentType(contentType)) {
    throw new Error("Tipo de arquivo não permitido");
  }

  const savedToBlob = await saveToBlob(blobKey, buffer, contentType);
  if (!savedToBlob) {
    mkdirSync(LOCAL_DIR, { recursive: true });
    const path = localPath(blobKey);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, buffer);
    writeFileSync(localMetaPath(blobKey), JSON.stringify({ contentType }), "utf8");
  }
}

/** Lê bytes do anexo (Blobs ou filesystem local). */
export async function readAttachmentFile(
  blobKey: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const fromBlob = await readFromBlob(blobKey);
  if (fromBlob) return fromBlob;

  const metaPath = localMetaPath(blobKey);
  if (existsSync(metaPath)) {
    const { contentType } = JSON.parse(readFileSync(metaPath, "utf8")) as { contentType: string };
    const path = localPath(blobKey);
    if (existsSync(path)) {
      return { buffer: readFileSync(path), contentType };
    }
  }

  return null;
}
