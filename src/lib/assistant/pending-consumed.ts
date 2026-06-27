import "server-only";
import crypto from "node:crypto";

const BLOB_STORE = "bibi-assistant";
const CONSUMED_PREFIX = "pending-jti:";
const TTL_SEC = 10 * 60;

/** Fallback local quando Blobs indisponível (dev / vitest). */
const memoryConsumed = new Map<string, number>();

function purgeMemory(): void {
  const now = Date.now();
  for (const [key, exp] of memoryConsumed.entries()) {
    if (exp <= now) memoryConsumed.delete(key);
  }
}

/**
 * Marca um JTI de pending action como consumido (one-time confirm em serverless).
 * Retorna false se já foi consumido.
 */
export async function tryMarkPendingJtiConsumed(jti: string): Promise<boolean> {
  if (!jti) return false;

  purgeMemory();
  if (memoryConsumed.has(jti)) return false;

  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: BLOB_STORE, consistency: "strong" });
    const key = `${CONSUMED_PREFIX}${jti}`;
    const existing = await store.get(key);
    if (existing) return false;
    await store.set(key, "1", { metadata: { consumedAt: new Date().toISOString() } });
    memoryConsumed.set(jti, Date.now() + TTL_SEC * 1000);
    return true;
  } catch {
    if (memoryConsumed.has(jti)) return false;
    memoryConsumed.set(jti, Date.now() + TTL_SEC * 1000);
    return true;
  }
}

export function createPendingJti(): string {
  return crypto.randomUUID();
}
