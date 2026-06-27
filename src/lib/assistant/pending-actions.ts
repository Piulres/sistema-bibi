import "server-only";
import crypto from "node:crypto";
import type { PendingActionPayload } from "@/lib/assistant/types";
import {
  decodePendingActionToken,
  encodePendingActionToken,
  isSignedPendingActionToken,
} from "@/lib/assistant/session-state";

type StoredPendingAction = {
  userId: string;
  tenantId: string;
  expiresAt: number;
  payload: PendingActionPayload;
};

const TTL_MS = 10 * 60 * 1000;
/** Fallback em memória para tokens UUID legados no mesmo processo (dev). */
const store = new Map<string, StoredPendingAction>();

function purgeExpired(): void {
  const now = Date.now();
  for (const [id, item] of store.entries()) {
    if (item.expiresAt <= now) store.delete(id);
  }
}

export function createPendingAction(
  userId: string,
  tenantId: string,
  payload: PendingActionPayload,
): string {
  return encodePendingActionToken(userId, tenantId, payload);
}

export function peekPendingAction(
  id: string,
  userId: string,
  tenantId: string,
): PendingActionPayload | null {
  if (isSignedPendingActionToken(id)) {
    return decodePendingActionToken(id, userId, tenantId);
  }

  purgeExpired();
  const item = store.get(id);
  if (!item || item.userId !== userId || item.tenantId !== tenantId) return null;
  if (item.expiresAt <= Date.now()) {
    store.delete(id);
    return null;
  }
  return item.payload;
}

export function consumePendingAction(
  id: string,
  userId: string,
  tenantId: string,
): PendingActionPayload | null {
  if (isSignedPendingActionToken(id)) {
    return decodePendingActionToken(id, userId, tenantId);
  }

  const payload = peekPendingAction(id, userId, tenantId);
  if (payload) store.delete(id);
  return payload;
}

export function cancelPendingAction(id: string, userId: string, tenantId: string): boolean {
  if (isSignedPendingActionToken(id)) {
    return decodePendingActionToken(id, userId, tenantId) !== null;
  }

  const item = store.get(id);
  if (!item || item.userId !== userId || item.tenantId !== tenantId) return false;
  store.delete(id);
  return true;
}

/** Apenas testes — cria ID UUID legado em memória. */
export function createLegacyPendingActionForTests(
  userId: string,
  tenantId: string,
  payload: PendingActionPayload,
): string {
  purgeExpired();
  const id = crypto.randomUUID();
  store.set(id, {
    userId,
    tenantId,
    expiresAt: Date.now() + TTL_MS,
    payload,
  });
  return id;
}
