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
 * Usa `onlyIfNew` no Blobs para operação atômica create-if-absent.
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
    const result = await store.set(key, "1", {
      onlyIfNew: true,
      metadata: { consumedAt: new Date().toISOString() },
    });
    if (!result.modified) return false;
    memoryConsumed.set(jti, Date.now() + TTL_SEC * 1000);
    return true;
  } catch {
    if (process.env.NODE_ENV === "production") {
      return false;
    }
    if (memoryConsumed.has(jti)) return false;
    memoryConsumed.set(jti, Date.now() + TTL_SEC * 1000);
    return true;
  }
}

/** Libera JTI após falha de execução — permite nova tentativa de confirmação. */
export async function releasePendingJti(jti: string): Promise<void> {
  if (!jti) return;
  memoryConsumed.delete(jti);
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: BLOB_STORE, consistency: "strong" });
    await store.delete(`${CONSUMED_PREFIX}${jti}`);
  } catch {
    // Blobs indisponível em dev — memória já limpa
  }
}

export function createPendingJti(): string {
  return crypto.randomUUID();
}
