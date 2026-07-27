import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as postPatient } from "@/app/api/interno/patients/route";
import { GET as getLaunches, POST as postLaunch } from "@/app/api/interno/clinic-finance/launches/route";
import { jsonRequest } from "../helpers/request";
import {
  clearSessionMock,
  sessionMockState,
  setSessionForEmail,
  signSessionToken,
} from "../helpers/session-mock";
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

describe("API — requireInternoModuleWrite (Fase 5) — READONLY não muta", () => {
  afterEach(() => {
    clearSessionMock();
  });

  async function setReadonlySession() {
    const prisma = getTestPrisma();
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: "faturamento@bibi.health" },
    });
    const readonly = await prisma.user.upsert({
      where: { email: "readonly.fase5@bibi.health" },
      update: { internoProfile: "READONLY", role: "INTERNO", tenantId: admin.tenantId },
      create: {
        email: "readonly.fase5@bibi.health",
        name: "Leitura Clínica",
        password: admin.password,
        role: "INTERNO",
        internoProfile: "READONLY",
        tenantId: admin.tenantId,
      },
    });
    sessionMockState.token = signSessionToken(readonly.id);
  }

  it("READONLY com módulo gestao lê launches mas não cria — write guard", async () => {
    await setReadonlySession();
    const getRes = await getLaunches(
      new Request("http://localhost/api/interno/clinic-finance/launches"),
    );
    expect(getRes.status).toBe(200);

    const postRes = await postLaunch(
      jsonRequest("http://localhost/api/interno/clinic-finance/launches", {
        method: "POST",
        body: {
          patientName: "Maria Oliveira",
          providerId: "x",
          procedureId: "y",
          paymentMethod: "PIX",
          amountReceived: 100,
        },
      }),
    );
    expect(postRes.status).toBe(403);
    const body = await postRes.json();
    expect(body.error).toMatch(/somente leitura|leitura/i);
  });

  it("READONLY não cria paciente — sem módulo cadastros / write guard", async () => {
    await setReadonlySession();
    const res = await postPatient(
      jsonRequest("http://localhost/api/interno/patients", {
        method: "POST",
        body: {
          name: "Ana Souza",
          cpf: "529.982.247-25",
          birthDate: "1990-01-15",
        },
      }),
    );
    expect(res.status).toBe(403);
  });

  it("RECEPCAO com cadastros cria paciente — write guard não bloqueia perfis de escrita", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const stamp = Date.now().toString().slice(-6);
    const res = await postPatient(
      jsonRequest("http://localhost/api/interno/patients", {
        method: "POST",
        body: {
          name: `Carlos Mendes ${stamp}`,
          cpf: "390.533.447-05",
          birthDate: "1985-03-20",
        },
      }),
    );
    expect(res.status).not.toBe(403);
  });
});
