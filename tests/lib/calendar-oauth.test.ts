import { afterEach, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/calendar/token-crypto";
import {
  createOAuthStateCookie,
  parseOAuthStateCookie,
  sanitizeReturnTo,
} from "@/lib/calendar/oauth-state";
import { createMockCalendarAdapter } from "@/lib/calendar/providers/mock";
import { appointmentToIcsEvent } from "@/lib/calendar/appointment-event";

describe("calendar token-crypto", () => {
  it("criptografa e descriptografa tokens", () => {
    const plain = "ya29.oauth-token-example";
    const enc = encryptSecret(plain);
    expect(enc.startsWith("v1.")).toBe(true);
    expect(enc).not.toContain(plain);
    expect(decryptSecret(enc)).toBe(plain);
  });
});

describe("calendar oauth-state", () => {
  it("assina e valida state com nonce", () => {
    const { cookieValue, stateParam } = createOAuthStateCookie({
      provider: "GOOGLE",
      scope: "PROVIDER",
      userId: "user_1",
      tenantId: "tenant_1",
      returnTo: "/prestador",
    });
    const parsed = parseOAuthStateCookie(cookieValue, stateParam);
    expect(parsed?.provider).toBe("GOOGLE");
    expect(parsed?.userId).toBe("user_1");
    expect(parseOAuthStateCookie(cookieValue, "wrong-nonce")).toBeNull();
  });

  it("sanitiza returnTo", () => {
    expect(sanitizeReturnTo("/interno/agenda", "/prestador")).toBe("/interno/agenda");
    expect(sanitizeReturnTo("https://evil.com", "/prestador")).toBe("/prestador");
    expect(sanitizeReturnTo("//evil.com", "/prestador")).toBe("/prestador");
  });
});

describe("calendar mock adapter", () => {
  it("faz exchange e upsert/delete sem rede", async () => {
    const adapter = createMockCalendarAdapter("GOOGLE", "Google mock");
    expect(adapter.isConfigured()).toBe(true);
    const tokens = await adapter.exchangeCode({
      code: "mock",
      redirectUri: "http://localhost/callback",
    });
    expect(tokens.accessToken).toContain("mock-access");
    const event = appointmentToIcsEvent({
      id: "a1",
      scheduledAt: new Date("2026-08-01T12:00:00Z"),
      status: "CONFIRMADO",
      modality: "PRESENCIAL",
      telemedicineUrl: null,
      reason: null,
      patientName: "Ana",
      providerName: "Helena",
    });
    const created = await adapter.upsertEvent({
      accessToken: tokens.accessToken,
      calendarId: "primary",
      event: {
        summary: event.summary,
        description: event.description ?? "",
        start: event.start,
        end: event.end,
        status: "CONFIRMED",
        iCalUID: event.uid,
      },
    });
    expect(created.externalEventId).toMatch(/^mock-evt-/);
    await adapter.deleteEvent({
      accessToken: tokens.accessToken,
      calendarId: "primary",
      externalEventId: created.externalEventId,
    });
  });
});

describe("calendar provider env gate", () => {
  const prev = process.env.CALENDAR_OAUTH_MOCK;

  afterEach(() => {
    if (prev === undefined) delete process.env.CALENDAR_OAUTH_MOCK;
    else process.env.CALENDAR_OAUTH_MOCK = prev;
  });

  it("mock mode marca provedores como configurados", async () => {
    process.env.CALENDAR_OAUTH_MOCK = "true";
    const { listCalendarProviderStatus } = await import("@/lib/calendar/providers");
    const status = listCalendarProviderStatus();
    expect(status.every((p) => p.configured && p.mock)).toBe(true);
  });

  it("ausente ou true → mock; false desliga", async () => {
    delete process.env.CALENDAR_OAUTH_MOCK;
    const mod = await import("@/lib/calendar/providers");
    expect(mod.isCalendarOAuthMock()).toBe(true);
    process.env.CALENDAR_OAUTH_MOCK = "false";
    expect(mod.isCalendarOAuthMock()).toBe(false);
  });
});
