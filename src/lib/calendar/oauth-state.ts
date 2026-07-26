import crypto from "node:crypto";
import { getSessionSecret } from "@/lib/security/config";
import type { CalendarFeedScope } from "@/lib/calendar/calendar-feed-service";
import type { CalendarProviderId } from "@/lib/calendar/providers/types";

export const OAUTH_STATE_COOKIE = "bibi_cal_oauth";

export type CalendarOAuthState = {
  provider: CalendarProviderId;
  scope: CalendarFeedScope;
  userId: string;
  tenantId: string;
  returnTo: string;
  nonce: string;
  exp: number;
};

function sign(value: string): string {
  const sig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("base64url");
  return `${value}.${sig}`;
}

function verify(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const value = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = crypto
    .createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return value;
}

export function createOAuthStateCookie(state: Omit<CalendarOAuthState, "nonce" | "exp">): {
  cookieValue: string;
  stateParam: string;
} {
  const payload: CalendarOAuthState = {
    ...state,
    nonce: crypto.randomBytes(16).toString("base64url"),
    exp: Date.now() + 10 * 60_000,
  };
  const raw = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const cookieValue = sign(raw);
  return { cookieValue, stateParam: payload.nonce };
}

export function parseOAuthStateCookie(
  cookieValue: string | undefined,
  stateParam: string | null,
): CalendarOAuthState | null {
  if (!cookieValue || !stateParam) return null;
  const raw = verify(cookieValue);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as CalendarOAuthState;
    if (parsed.nonce !== stateParam) return null;
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now()) return null;
    if (!parsed.userId || !parsed.tenantId || !parsed.provider) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Só permite retornos internos seguros. */
export function sanitizeReturnTo(value: string | null | undefined, fallback: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("://")) return fallback;
  return value;
}
