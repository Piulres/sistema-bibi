import crypto from "node:crypto";

/** Compara segredo de cron com proteção contra timing attacks. */
export function isValidCronSecret(provided: string | null, expected: string | undefined): boolean {
  const exp = expected?.trim();
  if (!exp || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(exp);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
