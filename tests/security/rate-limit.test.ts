import { describe, expect, it } from "vitest";
import {
  peekRateLimit,
  recordRateLimitHit,
  shouldApplyRateLimit,
} from "@/lib/security/rate-limit";

describe("rate-limit — auth", () => {
  it("desliga em CI e NODE_ENV=test", () => {
    const originalCi = process.env.CI;
    const originalNode = process.env.NODE_ENV;
    process.env.CI = "true";
    expect(shouldApplyRateLimit()).toBe(false);
    process.env.CI = "";
    process.env.NODE_ENV = "test";
    expect(shouldApplyRateLimit()).toBe(false);
    process.env.CI = originalCi;
    process.env.NODE_ENV = originalNode;
  });

  it("peek não incrementa; record incrementa só falhas", () => {
    const key = `test:${Date.now()}`;
    const options = { limit: 2, windowMs: 60_000 };
    expect(peekRateLimit(key, options).allowed).toBe(true);
    expect(peekRateLimit(key, options).allowed).toBe(true);
    recordRateLimitHit(key, options);
    expect(peekRateLimit(key, options).allowed).toBe(true);
    recordRateLimitHit(key, options);
    expect(peekRateLimit(key, options).allowed).toBe(false);
  });
});
