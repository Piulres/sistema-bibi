import { describe, expect, it } from "vitest";
import {
  buildOtpAuthUrl,
  createMfaChallengeToken,
  createMfaSetup,
  generateTotp,
  parseMfaChallengeToken,
  verifyTotp,
} from "@/lib/mfa";

describe("MFA / tokens HMAC", () => {
  it("gera e verifica TOTP no passo atual", () => {
    const { secret } = createMfaSetup("user@test.com");
    const code = generateTotp(secret);
    expect(code).toMatch(/^\d{6}$/);
    expect(verifyTotp(secret, code)).toBe(true);
    expect(verifyTotp(secret, "000000")).toBe(false);
  });

  it("monta URL otpauth válida", () => {
    const url = buildOtpAuthUrl("a@b.com", "JBSWY3DPEHPK3PXP");
    expect(url).toContain("otpauth://totp/");
    expect(url).toContain("algorithm=SHA1");
    expect(url).toContain("digits=6");
  });

  it("challenge token válido é parseável", () => {
    const token = createMfaChallengeToken("user-1", "interno");
    const parsed = parseMfaChallengeToken(token);
    expect(parsed).toEqual({ userId: "user-1", portal: "interno" });
  });

  it("rejeita token adulterado (integridade HMAC)", () => {
    const token = createMfaChallengeToken("user-1", "interno");
    const tampered = `${token}x`;
    expect(parseMfaChallengeToken(tampered)).toBeNull();
  });

  it("rejeita token com assinatura trocada", () => {
    const token = createMfaChallengeToken("user-1", "interno");
    const idx = token.lastIndexOf(".");
    const forged = `${token.slice(0, idx)}.${"0".repeat(64)}`;
    expect(parseMfaChallengeToken(forged)).toBeNull();
  });

  it("rejeita challenge expirado", () => {
    const token = createMfaChallengeToken("user-1", "interno");
    // Simula expiração avançando o relógio 6 minutos
    const realNow = Date.now;
    Date.now = () => realNow() + 6 * 60 * 1000;
    try {
      expect(parseMfaChallengeToken(token)).toBeNull();
    } finally {
      Date.now = realNow;
    }
  });
});
