import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password", () => {
  it("gera hash scrypt verificável", () => {
    const hash = hashPassword("bibi123");
    expect(hash.startsWith("scrypt:")).toBe(true);
    expect(verifyPassword("bibi123", hash)).toBe(true);
    expect(verifyPassword("wrong", hash)).toBe(false);
  });

  it("rejeita hash scrypt malformado", () => {
    expect(verifyPassword("x", "scrypt:onlyonepart")).toBe(false);
    expect(verifyPassword("x", "scrypt:aa:bb:cc")).toBe(false);
  });

  it("aceita legado plaintext apenas para migração (risco documentado)", () => {
    expect(verifyPassword("legacy", "legacy")).toBe(true);
    expect(verifyPassword("legacy", "other")).toBe(false);
  });

  it("hashes distintos para mesma senha (salt aleatório)", () => {
    const a = hashPassword("bibi123");
    const b = hashPassword("bibi123");
    expect(a).not.toBe(b);
    expect(verifyPassword("bibi123", a)).toBe(true);
    expect(verifyPassword("bibi123", b)).toBe(true);
  });
});
