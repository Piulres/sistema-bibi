import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, PATCH } from "@/app/api/interno/assistant/settings/route";
import { jsonRequest } from "../helpers/request";
import {
  clearSessionMock,
  sessionMockState,
  setSessionForEmail,
} from "../helpers/session-mock";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === "bibi_session" && sessionMockState.token
        ? { value: sessionMockState.token }
        : undefined,
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

describe("API — /api/interno/assistant/settings", () => {
  afterEach(() => {
    clearSessionMock();
    vi.unstubAllEnvs();
  });

  it("rejeita sem sessão", async () => {
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("rejeita perfil RECEPCAO (sem módulo assistente)", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("ADMIN lê settings do tenant", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const resRecep = await GET();
    expect(resRecep.status).toBe(403);

    await setSessionForEmail("faturamento@bibi.health");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.settings).toMatchObject({ aiEnabled: false, rulesEnabled: true });
    expect(body.mode).toBe("rules");
    expect(body.inventory.scenarios).toBeGreaterThan(60);
  });

  it("PATCH aiEnabled exige gateway quando true", async () => {
    await setSessionForEmail("seguranca@bibi.health");
    vi.stubEnv("OPENAI_BASE_URL", "");
    vi.stubEnv("OPENAI_API_KEY", "");
    const res = await PATCH(
      jsonRequest("http://localhost/api/interno/assistant/settings", {
        method: "PATCH",
        body: { aiEnabled: true },
      }),
    );
    expect(res.status).toBe(422);
  });

  it("ADMIN persiste ruleOverrides e devolve preview efetivo — CRUD Fase 3", async () => {
    await setSessionForEmail("faturamento@bibi.health");

    const patchRes = await PATCH(
      jsonRequest("http://localhost/api/interno/assistant/settings", {
        method: "PATCH",
        body: {
          ruleOverrides: [
            { tool: "count_appointments", addTriggers: ["quantos exames hoje"] },
            { tool: "list_debtors", disabled: true },
          ],
        },
      }),
    );
    expect(patchRes.status).toBe(200);
    const patched = await patchRes.json();
    expect(patched.ruleOverrides).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tool: "count_appointments" }),
        expect.objectContaining({ tool: "list_debtors", disabled: true }),
      ]),
    );
    expect(patched.rules.tenantOverrides).toBe(2);
    const countPreview = patched.previewRules.find(
      (r: { tool: string }) => r.tool === "count_appointments",
    );
    expect(countPreview?.triggers.some((t: string) => /quantos exames hoje/i.test(t))).toBe(true);
    expect(countPreview?.source).toBe("tenant");
    const debtors = patched.previewRules.find((r: { tool: string }) => r.tool === "list_debtors");
    expect(debtors?.disabled).toBe(true);

    const getRes = await GET();
    expect(getRes.status).toBe(200);
    const body = await getRes.json();
    expect(body.ruleOverrides).toHaveLength(2);

    const clearRes = await PATCH(
      jsonRequest("http://localhost/api/interno/assistant/settings", {
        method: "PATCH",
        body: { ruleOverrides: [] },
      }),
    );
    expect(clearRes.status).toBe(200);
    const cleared = await clearRes.json();
    expect(cleared.ruleOverrides).toEqual([]);
    expect(cleared.rules.tenantOverrides).toBe(0);
  });
});
