import crypto from "node:crypto";
import { getSessionSecret } from "@/lib/security/config";

export const SESSION_COOKIE_NAME = "bibi_session";

export function signSessionValue(value: string): string {
  const secret = getSessionSecret();
  const sig = crypto.createHmac("sha256", secret).update(value).digest("hex");
  return `${value}.${sig}`;
}

/** Valida assinatura HMAC do cookie de sessão. Retorna userId ou null. */
export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const value = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const secret = getSessionSecret();
  const expected = crypto.createHmac("sha256", secret).update(value).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return value;
}
