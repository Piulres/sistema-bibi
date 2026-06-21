import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const PREFIX = "scrypt:";

/** Gera hash scrypt para armazenamento seguro (POC+). */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${PREFIX}${salt}:${hash}`;
}

/** Verifica senha contra hash scrypt ou texto legado (migração). */
export function verifyPassword(password: string, stored: string): boolean {
  if (!stored.startsWith(PREFIX)) {
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
