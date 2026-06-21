import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const BLOB_STORE = "bibi-tenant-logos";
const LOCAL_DIR = join(process.cwd(), "public", "tenant-logos");

function extFromContentType(contentType: string): string {
  switch (contentType) {
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "image/svg+xml":
      return ".svg";
    default:
      return ".png";
  }
}

function blobKey(tenantId: string): string {
  return `logos/${tenantId}`;
}

function localMetaPath(tenantId: string): string {
  return join(LOCAL_DIR, `${tenantId}.meta.json`);
}

function localImagePath(tenantId: string, contentType: string): string {
  return join(LOCAL_DIR, `${tenantId}${extFromContentType(contentType)}`);
}

async function saveToBlob(tenantId: string, buffer: Buffer, contentType: string): Promise<boolean> {
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: BLOB_STORE, consistency: "strong" });
    const arrayBuffer = new ArrayBuffer(buffer.length);
    new Uint8Array(arrayBuffer).set(buffer);
    await store.set(blobKey(tenantId), arrayBuffer, { metadata: { contentType } });
    return true;
  } catch {
    return false;
  }
}

async function readFromBlob(
  tenantId: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: BLOB_STORE });
    const result = await store.getWithMetadata(blobKey(tenantId), { type: "arrayBuffer" });
    if (!result) return null;
    return {
      buffer: Buffer.from(result.data as ArrayBuffer),
      contentType: (result.metadata?.contentType as string | undefined) ?? "image/png",
    };
  } catch {
    return null;
  }
}

/** URL pública estável para exibir o logo do tenant. */
export function tenantLogoPublicPath(tenantId: string, version?: number): string {
  const base = `/api/branding/logo/${tenantId}`;
  return version ? `${base}?v=${version}` : base;
}

/** Persiste logo e retorna URL pública. */
export async function saveTenantLogo(
  tenantId: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const savedToBlob = await saveToBlob(tenantId, buffer, contentType);
  if (!savedToBlob) {
    mkdirSync(LOCAL_DIR, { recursive: true });
    writeFileSync(localImagePath(tenantId, contentType), buffer);
    writeFileSync(localMetaPath(tenantId), JSON.stringify({ contentType }), "utf8");
  }

  return tenantLogoPublicPath(tenantId, Date.now());
}

/** Lê bytes do logo (Blobs ou filesystem local). */
export async function readTenantLogo(
  tenantId: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const fromBlob = await readFromBlob(tenantId);
  if (fromBlob) return fromBlob;

  if (existsSync(localMetaPath(tenantId))) {
    const { contentType } = JSON.parse(readFileSync(localMetaPath(tenantId), "utf8")) as {
      contentType: string;
    };
    const imagePath = localImagePath(tenantId, contentType);
    if (existsSync(imagePath)) {
      return { buffer: readFileSync(imagePath), contentType };
    }
  }

  for (const ext of [".png", ".jpg", ".webp", ".svg"]) {
    const legacyPath = join(LOCAL_DIR, `${tenantId}${ext}`);
    if (existsSync(legacyPath)) {
      const contentType =
        ext === ".svg"
          ? "image/svg+xml"
          : ext === ".webp"
            ? "image/webp"
            : ext === ".jpg"
              ? "image/jpeg"
              : "image/png";
      return { buffer: readFileSync(legacyPath), contentType };
    }
  }

  return null;
}
