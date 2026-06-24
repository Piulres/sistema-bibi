import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { isProductionRuntime } from "@/lib/security/config";

const PREFIX = "scrypt:";

/** Gera hash scrypt para armazenamento seguro. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${PREFIX}${salt}:${hash}`;
}

/** Verifica senha contra hash scrypt. Em produção, rejeita texto legado. */
export function verifyPassword(password: string, stored: string): boolean {
  if (!stored.startsWith(PREFIX)) {
    if (isProductionRuntime()) return false;
    return stored === password;
  }

  const parts = stored.slice(PREFIX.length).split(":");
  if (parts.length !== 2) return false;

  const [salt, expected] = parts;
  const derived = scryptSync(password, salt, 64).toString("hex");

  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(derived, "hex"));
  } catch {
    return false;
  }
}
