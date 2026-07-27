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
});
