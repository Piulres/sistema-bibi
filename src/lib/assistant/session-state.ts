import "server-only";
import crypto from "node:crypto";
import type { PendingActionPayload } from "@/lib/assistant/types";
import { getSessionSecret } from "@/lib/security/config";
import type { OperationDraft, PendingChoice } from "@/lib/assistant/provider/mock-context";
import { createPendingJti } from "@/lib/assistant/pending-consumed";

const PENDING_PREFIX = "pa.";
const SESSION_PREFIX = "as.";
const PENDING_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 15 * 60 * 1000;

type PendingEnvelope = {
  jti: string;
  userId: string;
  tenantId: string;
  exp: number;
  payload: PendingActionPayload;
};

export type AssistantSessionSnapshot = {
  exp: number;
  lastIntent?: string;
  operationDraft?: OperationDraft;
  pendingChoice?: PendingChoice;
};

function signPayload(prefix: string, body: string): string {
  const sig = crypto.createHmac("sha256", getSessionSecret()).update(body).digest("base64url");
  return `${prefix}${body}.${sig}`;
}

function verifySignedPayload<T>(
  token: string,
  prefix: string,
  parse: (body: string) => T | null,
): T | null {
  if (!token.startsWith(prefix)) return null;
  const rest = token.slice(prefix.length);
  const dot = rest.lastIndexOf(".");
  if (dot < 0) return null;
  const body = rest.slice(0, dot);
  const sig = rest.slice(dot + 1);
  const expected = crypto
    .createHmac("sha256", getSessionSecret())
    .update(body)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return parse(body);
}

/** Token assinado com payload da ação — funciona em serverless (sem Map em memória). */
export function encodePendingActionToken(
  userId: string,
  tenantId: string,
  payload: PendingActionPayload,
): string {
  const envelope: PendingEnvelope = {
    jti: createPendingJti(),
    userId,
    tenantId,
    exp: Date.now() + PENDING_TTL_MS,
    payload,
  };
  const body = Buffer.from(JSON.stringify(envelope)).toString("base64url");
  return signPayload(PENDING_PREFIX, body);
}

export function decodePendingActionToken(
  token: string,
  userId: string,
  tenantId: string,
): PendingActionPayload | null {
  const envelope = decodePendingEnvelope(token, userId, tenantId);
  return envelope?.payload ?? null;
}

export function decodePendingEnvelope(
  token: string,
  userId: string,
  tenantId: string,
): PendingEnvelope | null {
  const envelope = verifySignedPayload(token, PENDING_PREFIX, (body) => {
    try {
      return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as PendingEnvelope;
    } catch {
      return null;
    }
  });
  if (!envelope) return null;
  if (envelope.userId !== userId || envelope.tenantId !== tenantId) return null;
  if (envelope.exp <= Date.now()) return null;
  if (!envelope.jti) return null;
  return envelope;
}

export function isSignedPendingActionToken(token: string): boolean {
  return token.startsWith(PENDING_PREFIX);
}

export function encodeAssistantSessionState(
  userId: string,
  snapshot: Omit<AssistantSessionSnapshot, "exp">,
): string | undefined {
  const hasState = Boolean(
    snapshot.lastIntent || snapshot.operationDraft || snapshot.pendingChoice,
  );
  if (!hasState) return undefined;

  const envelope: AssistantSessionSnapshot = {
    ...snapshot,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify({ userId, ...envelope })).toString("base64url");
  return signPayload(SESSION_PREFIX, body);
}

export function decodeAssistantSessionState(
  token: string | undefined,
  userId: string,
): AssistantSessionSnapshot | null {
  if (!token?.trim()) return null;

  const parsed = verifySignedPayload(token, SESSION_PREFIX, (body) => {
    try {
      return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
        userId: string;
      } & AssistantSessionSnapshot;
    } catch {
      return null;
    }
  });
  if (!parsed || parsed.userId !== userId) return null;
  if (parsed.exp <= Date.now()) return null;
  return {
    exp: parsed.exp,
    lastIntent: parsed.lastIntent,
    operationDraft: parsed.operationDraft,
    pendingChoice: parsed.pendingChoice,
  };
}
