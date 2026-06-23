import "server-only";
import crypto from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(input: string): Buffer {
  const normalized = input.replace(/=+$/, "").toUpperCase().replace(/\s/g, "");
  let bits = "";
  for (const char of normalized) {
    const val = BASE32_ALPHABET.indexOf(char);
    if (val < 0) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateSecret(length = 20): string {
  const bytes = crypto.randomBytes(length);
  let secret = "";
  for (let i = 0; i < bytes.length; i++) {
    secret += BASE32_ALPHABET[bytes[i] % 32];
  }
  return secret;
}

function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % 1_000_000).toString().padStart(6, "0");
}

export function generateTotp(secret: string, counter?: number): string {
  const step = counter ?? Math.floor(Date.now() / 1000 / 30);
  return hotp(secret, step);
}

export function verifyTotp(secret: string, token: string): boolean {
  const normalized = token.replace(/\D/g, "").padStart(6, "0").slice(-6);
  if (normalized.length !== 6) return false;
  const step = Math.floor(Date.now() / 1000 / 30);
  for (let w = -1; w <= 1; w++) {
    if (hotp(secret, step + w) === normalized) return true;
  }
  return false;
}

export function buildOtpAuthUrl(email: string, secret: string, issuer = "ServiceOS Bibi"): string {
  const label = encodeURIComponent(`${issuer}:${email}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

export function createMfaSetup(email: string) {
  const secret = generateSecret(20);
  return {
    secret,
    otpauthUrl: buildOtpAuthUrl(email, secret),
  };
}

const MFA_CHALLENGE_COOKIE = "bibi_mfa_challenge";
const SECRET = process.env.SESSION_SECRET ?? "bibi-poc-dev-secret-change-me";

function sign(value: string): string {
  const sig = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  return `${value}.${sig}`;
}

function verifySigned(token: string | undefined): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const value = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return value;
}

/** Token temporário pós-senha quando MFA está habilitado. */
export function createMfaChallengeToken(userId: string, portal: string): string {
  const payload = JSON.stringify({
    userId,
    portal,
    exp: Date.now() + 5 * 60 * 1000,
  });
  return sign(Buffer.from(payload).toString("base64url"));
}

export function parseMfaChallengeToken(token: string): { userId: string; portal: string } | null {
  const value = verifySigned(token);
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString()) as {
      userId?: string;
      portal?: string;
      exp?: number;
    };
    if (!parsed.userId || !parsed.portal || !parsed.exp || parsed.exp < Date.now()) {
      return null;
    }
    return { userId: parsed.userId, portal: parsed.portal };
  } catch {
    return null;
  }
}

export { MFA_CHALLENGE_COOKIE };
