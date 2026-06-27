import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as chatPost } from "@/app/api/assistant/chat/route";
import { POST as confirmPost } from "@/app/api/assistant/confirm/route";
import { isHumanized } from "@/lib/assistant/humanize";
import { scenariosWithExpectedTool } from "@/lib/assistant/scenarios";
import { clearMockContext } from "@/lib/assistant/provider/mock-match";
import { createPendingAction } from "@/lib/assistant/pending-actions";
import { jsonRequest } from "../helpers/request";
import {
  clearSessionMock,
  sessionMockState,
  setSessionForEmail,
} from "../helpers/session-mock";
import {
  parseAssistantChatResponse,
  postAssistantChat,
  postAssistantConfirm,
} from "../helpers/assistant-api";
import { DEMO_EMAILS } from "../helpers/seed-fixtures";
import { getTestPrisma } from "../helpers/db";

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

async function clearContextForEmail(email: string) {
  const user = await getTestPrisma().user.findUniqueOrThrow({ where: { email } });
  clearMockContext(user.id);
}

describe("API — /api/assistant/chat", () => {
  afterEach(() => {
    clearSessionMock();
    vi.unstubAllEnvs();
  });

  it("rejeita sem sessão", async () => {
    const res = await chatPost(
      jsonRequest("http://localhost/api/assistant/chat", {
        method: "POST",
        body: { messages: [{ role: "user", content: "oi" }] },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("rejeita corpo sem mensagem do usuário", async () => {
    await setSessionForEmail(DEMO_EMAILS.internoRecepcao);
    const res = await chatPost(
      jsonRequest("http://localhost/api/assistant/chat", {
        method: "POST",
        body: { messages: [{ role: "assistant", content: "olá" }] },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rejeita corpo JSON inválido", async () => {
    await setSessionForEmail(DEMO_EMAILS.internoRecepcao);
    const res = await chatPost(
      new Request("http://localhost/api/assistant/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "",
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Requisição inválida");
  });

  it("retorna 503 quando assistente desabilitado", async () => {
    vi.stubEnv("ASSISTANT_ENABLED", "false");
    await setSessionForEmail(DEMO_EMAILS.internoRecepcao);
    const res = await chatPost(
      jsonRequest("http://localhost/api/assistant/chat", {
        method: "POST",
        body: { messages: [{ role: "user", content: "oi" }] },
      }),
    );
    expect(res.status).toBe(503);
  });

  describe("portal interno (recepção)", () => {
    beforeEach(async () => {
      await setSessionForEmail(DEMO_EMAILS.internoRecepcao);
      await clearContextForEmail(DEMO_EMAILS.internoRecepcao);
    });

    it("responde consulta de agenda com tom humanizado", async () => {
      const res = await postAssistantChat([
        { role: "user", content: "Quantos agendamentos temos hoje?" },
      ]);
      expect(res.status).toBe(200);
      const body = await parseAssistantChatResponse(res);
      expect(body.message.role).toBe("assistant");
      expect(body.message.content).toMatch(/agendamento|consulta/i);
      expect(isHumanized(body.message.content)).toBe(true);
    });

    it("inicia draft de agendamento", async () => {
      const res = await postAssistantChat([
        { role: "user", content: "preciso marcar uma consulta" },
      ]);
      expect(res.status).toBe(200);
      const body = await parseAssistantChatResponse(res);
      expect(body.message.content).toMatch(/para quem|paciente/i);
      expect(isHumanized(body.message.content)).toBe(true);
    });
  });

  describe("portal prestador", () => {
    beforeEach(async () => {
      await setSessionForEmail(DEMO_EMAILS.prestador);
      await clearContextForEmail(DEMO_EMAILS.prestador);
    });

    it("consulta agenda do dia", async () => {
      const res = await postAssistantChat([
        { role: "user", content: "Minha agenda de hoje" },
      ]);
      expect(res.status).toBe(200);
      const body = await parseAssistantChatResponse(res);
      expect(body.message.content).toMatch(/agenda|agendamento|consulta/i);
      expect(isHumanized(body.message.content)).toBe(true);
    });
  });

  describe("portal PJ", () => {
    beforeEach(async () => {
      await setSessionForEmail(DEMO_EMAILS.pjTechcorp);
      await clearContextForEmail(DEMO_EMAILS.pjTechcorp);
    });

    it("retorna resumo da empresa", async () => {
      const res = await postAssistantChat([{ role: "user", content: "Resumo da empresa" }]);
      expect(res.status).toBe(200);
      const body = await parseAssistantChatResponse(res);
      expect(body.message.content).toMatch(/empresa|beneficiário|fatura/i);
      expect(isHumanized(body.message.content)).toBe(true);
    });
  });

  describe("portal beneficiário", () => {
    beforeEach(async () => {
      await setSessionForEmail(DEMO_EMAILS.joao);
      await clearContextForEmail(DEMO_EMAILS.joao);
    });

    it("retorna resumo pessoal", async () => {
      const res = await postAssistantChat([{ role: "user", content: "Meu resumo" }]);
      expect(res.status).toBe(200);
      const body = await parseAssistantChatResponse(res);
      expect(body.message.content).toMatch(/olá|fatura|agendamento/i);
      expect(isHumanized(body.message.content)).toBe(true);
    });
  });

  describe("roteamento por catálogo de cenários (amostra API)", () => {
    const sample = scenariosWithExpectedTool().filter(
      (s) =>
        s.role === "INTERNO" &&
        s.category === "read" &&
        !s.internoProfile &&
        s.expectedTool === "count_appointments",
    );

    beforeEach(async () => {
      await setSessionForEmail(DEMO_EMAILS.internoAdmin);
      await clearContextForEmail(DEMO_EMAILS.internoAdmin);
    });

    it.each(sample.map((s) => [s.id, s.phrase] as const))(
      "API entende cenário %s",
      async (_id, phrase) => {
        const res = await postAssistantChat([{ role: "user", content: phrase }]);
        expect(res.status).toBe(200);
        const body = await parseAssistantChatResponse(res);
        expect(body.message.content.length).toBeGreaterThan(10);
        expect(isHumanized(body.message.content)).toBe(true);
      },
    );
  });
});

describe("API — /api/assistant/confirm", () => {
  afterEach(() => {
    clearSessionMock();
  });

  it("rejeita sem sessão", async () => {
    const res = await confirmPost(
      jsonRequest("http://localhost/api/assistant/confirm", {
        method: "POST",
        body: { pendingActionId: "x", confirmed: true },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("rejeita sem pendingActionId", async () => {
    await setSessionForEmail(DEMO_EMAILS.internoRecepcao);
    const res = await confirmPost(
      jsonRequest("http://localhost/api/assistant/confirm", {
        method: "POST",
        body: { confirmed: true },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rejeita corpo JSON inválido", async () => {
    await setSessionForEmail(DEMO_EMAILS.internoRecepcao);
    const res = await confirmPost(
      new Request("http://localhost/api/assistant/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "",
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Requisição inválida");
  });

  it("cancela ação pendente", async () => {
    const prisma = getTestPrisma();
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: DEMO_EMAILS.internoRecepcao },
    });
    await setSessionForEmail(DEMO_EMAILS.internoRecepcao);

    const pendingId = createPendingAction(user.id, user.tenantId, {
      type: "create_patient",
      data: { name: "Teste API", cpf: "52998224725", birthDate: "1990-01-01" },
    });

    const res = await postAssistantConfirm({ pendingActionId: pendingId, confirmed: false });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message.content).toMatch(/cancelad/i);
  });

  it("retorna 410 para ação expirada", async () => {
    await setSessionForEmail(DEMO_EMAILS.internoRecepcao);
    const res = await postAssistantConfirm({
      pendingActionId: "id-inexistente",
      confirmed: true,
    });
    expect(res.status).toBe(410);
  });

  it("rejeita reutilização do mesmo pendingActionId na confirmação", async () => {
    const prisma = getTestPrisma();
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: DEMO_EMAILS.internoRecepcao },
    });
    await setSessionForEmail(DEMO_EMAILS.internoRecepcao);

    const pendingId = createPendingAction(user.id, user.tenantId, {
      type: "create_patient",
      data: {
        name: `Replay Guard ${Date.now()}`,
        cpf: "39053344705",
        birthDate: "1990-01-01",
      },
    });

    const first = await postAssistantConfirm({ pendingActionId: pendingId, confirmed: true });
    expect(first.status).toBe(200);

    const replay = await postAssistantConfirm({ pendingActionId: pendingId, confirmed: true });
    expect(replay.status).toBe(410);
    const body = await replay.json();
    expect(body.error).toMatch(/já foi utilizada|expirada|inválida/i);
  });
});
