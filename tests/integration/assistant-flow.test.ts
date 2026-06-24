import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AssistantMessage } from "@/lib/assistant/types";
import { isHumanized } from "@/lib/assistant/humanize";
import { clearMockContext } from "@/lib/assistant/provider/mock-match";
import {
  parseAssistantChatResponse,
  postAssistantChat,
  postAssistantConfirm,
} from "../helpers/assistant-api";
import { DEMO_EMAILS } from "../helpers/seed-fixtures";
import { getTestPrisma } from "../helpers/db";
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

async function chatTurn(history: AssistantMessage[], userText: string) {
  const messages: AssistantMessage[] = [...history, { role: "user", content: userText }];
  const res = await postAssistantChat(messages);
  expect(res.status).toBe(200);
  const body = await parseAssistantChatResponse(res);
  expect(isHumanized(body.message.content)).toBe(true);
  return {
    messages: [...messages, body.message] as AssistantMessage[],
    body,
  };
}

/** Gera data/hora única para evitar conflito de slot entre execuções do test.db */
function uniqueAppointmentPhrase(): string {
  const salt = Date.now();
  const day = new Date();
  day.setDate(day.getDate() + 40 + (salt % 50));
  const dd = String(day.getDate()).padStart(2, "0");
  const mm = String(day.getMonth() + 1).padStart(2, "0");
  const yyyy = day.getFullYear();
  const hour = 9 + (salt % 4);
  const minute = (salt % 4) * 15;
  return `${dd}/${mm}/${yyyy} às ${hour}:${String(minute).padStart(2, "0")} com a Dra Helena`;
}

describe("Integração — fluxo do assistente via API", () => {
  afterEach(() => {
    clearSessionMock();
  });

  describe("agendamento multi-turno (interno)", () => {
    let createdAppointmentId: string | undefined;

    beforeEach(async () => {
      await setSessionForEmail(DEMO_EMAILS.internoRecepcao);
      const user = await getTestPrisma().user.findUniqueOrThrow({
        where: { email: DEMO_EMAILS.internoRecepcao },
      });
      clearMockContext(user.id);
      createdAppointmentId = undefined;
    });

    afterEach(async () => {
      if (createdAppointmentId) {
        const prisma = getTestPrisma();
        await prisma.appointment.delete({ where: { id: createdAppointmentId } }).catch(() => {});
      }
    });

    it("guia até confirmação e persiste agendamento", async () => {
      let messages: AssistantMessage[] = [];

      const step1 = await chatTurn(messages, "preciso marcar uma consulta");
      messages = step1.messages;
      expect(step1.body.message.content).toMatch(/para quem|paciente/i);

      const step2 = await chatTurn(messages, "é pro João Pereira");
      messages = step2.messages;
      expect(step2.body.message.content).toMatch(/prestador|data|horário|João/i);

      const step3 = await chatTurn(messages, uniqueAppointmentPhrase());
      messages = step3.messages;
      const confirmAction = step3.body.actions?.find((a) => a.type === "confirm");
      expect(confirmAction?.pendingActionId).toBeTruthy();
      expect(step3.body.message.content).toMatch(/confirme/i);

      const confirmRes = await postAssistantConfirm({
        pendingActionId: confirmAction!.pendingActionId!,
        confirmed: true,
      });
      const confirmed = await confirmRes.json();
      expect(confirmRes.status, confirmed.error).toBe(200);
      expect(confirmed.message.content).toMatch(/confirmado|agendado/i);
      expect(confirmed.entityId).toBeTruthy();
      createdAppointmentId = confirmed.entityId as string;

      const prisma = getTestPrisma();
      const appt = await prisma.appointment.findUnique({
        where: { id: confirmed.entityId },
        include: { patient: true, provider: true },
      });
      expect(appt?.patient.name).toMatch(/João Pereira/i);
      expect(appt?.provider.name).toMatch(/Helena/i);
    });
  });

  describe("prestador desconhecido", () => {
    beforeEach(async () => {
      await setSessionForEmail(DEMO_EMAILS.internoRecepcao);
      const user = await getTestPrisma().user.findUniqueOrThrow({
        where: { email: DEMO_EMAILS.internoRecepcao },
      });
      clearMockContext(user.id);
    });

    it("lista prestadores e conclui após escolha", async () => {
      const step1 = await chatTurn(
        [],
        "marcar consulta para João Pereira amanhã às 11h, não sei o médico",
      );
      expect(step1.body.actions?.some((a) => a.type === "choice")).toBe(true);
      expect(step1.body.message.content).toMatch(/opções|prestador/i);

      const choice = step1.body.actions?.find((a) => a.type === "choice");
      const helena =
        choice && "options" in choice
          ? (choice as { options: { label: string }[] }).options.find((o) =>
              /helena/i.test(o.label),
            )
          : undefined;

      const step2 = await chatTurn(step1.messages, helena?.label ?? "1");
      expect(step2.body.actions?.some((a) => a.type === "confirm")).toBe(true);
    });
  });

  describe("beneficiário — consulta de conta", () => {
    beforeEach(async () => {
      await setSessionForEmail(DEMO_EMAILS.joao);
      const user = await getTestPrisma().user.findUniqueOrThrow({
        where: { email: DEMO_EMAILS.joao },
      });
      clearMockContext(user.id);
    });

    it("responde sobre faturas sem tom robótico", async () => {
      const { body } = await chatTurn([], "Minhas faturas");
      expect(body.message.content.length).toBeGreaterThan(5);
      expect(isHumanized(body.message.content)).toBe(true);
    });
  });
});
