import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as pjBeneficiariesPost } from "@/app/api/pj/beneficiaries/route";
import {
  PATCH as pjBeneficiaryPatch,
  DELETE as pjBeneficiaryDelete,
} from "@/app/api/pj/beneficiaries/[id]/route";
import { jsonRequest } from "../helpers/request";
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

describe("POST/PATCH/DELETE /api/pj/beneficiaries — CRUD colaboradores (RH)", () => {
  afterEach(() => {
    clearSessionMock();
  });

  it("POST inclui colaborador na empresa logada (TechCorp)", async () => {
    const prisma = getTestPrisma();
    const rh = await prisma.user.findUniqueOrThrow({ where: { email: "rh@techcorp.com" } });
    const cpf = "390.533.447-05";

    await prisma.patient.deleteMany({ where: { cpf: cpf.replace(/\D/g, "") } }).catch(() => {});

    await setSessionForEmail("rh@techcorp.com");
    const res = await pjBeneficiariesPost(
      jsonRequest("http://localhost/api/pj/beneficiaries", {
        method: "POST",
        body: {
          name: "Colaborador Teste PJ",
          cpf,
          birthDate: "1992-03-15",
          employeeId: "TC-9001",
          bondType: "TITULAR",
        },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.patient.name).toBe("Colaborador Teste PJ");
    expect(body.patient.companyId).toBe(rh.companyId);

    const row = await prisma.patient.findUniqueOrThrow({ where: { id: body.patient.id } });
    expect(row.companyId).toBe(rh.companyId);
  });

  it("PATCH atualiza colaborador da própria empresa", async () => {
    const prisma = getTestPrisma();
    const rh = await prisma.user.findUniqueOrThrow({ where: { email: "rh@techcorp.com" } });
    const patient = await prisma.patient.findFirstOrThrow({
      where: { companyId: rh.companyId! },
    });

    await setSessionForEmail("rh@techcorp.com");
    const res = await pjBeneficiaryPatch(
      jsonRequest(`http://localhost/api/pj/beneficiaries/${patient.id}`, {
        method: "PATCH",
        body: { name: `${patient.name} (atualizado PJ)`, phone: "11999990000" },
      }),
      { params: Promise.resolve({ id: patient.id }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.patient.name).toContain("(atualizado PJ)");
  });

  it("DELETE desvincula colaborador (companyId null) sem apagar registro", async () => {
    const prisma = getTestPrisma();
    const rh = await prisma.user.findUniqueOrThrow({ where: { email: "rh@techcorp.com" } });
    const cpf = "52998224725";
    await prisma.patient.deleteMany({ where: { cpf } }).catch(() => {});

    const created = await prisma.patient.create({
      data: {
        tenantId: rh.tenantId,
        companyId: rh.companyId!,
        name: "Temp PJ Detach",
        cpf,
        birthDate: new Date("1988-01-01"),
        consentAt: new Date(),
        consentVersion: "v1-poc",
      },
    });

    await setSessionForEmail("rh@techcorp.com");
    const res = await pjBeneficiaryDelete(new Request(`http://localhost/api/pj/beneficiaries/${created.id}`, { method: "DELETE" }), {
      params: Promise.resolve({ id: created.id }),
    });
    expect(res.status).toBe(200);

    const row = await prisma.patient.findUniqueOrThrow({ where: { id: created.id } });
    expect(row.companyId).toBeNull();
  });

  it("rejeita PATCH em beneficiário de outra empresa (anti-IDOR)", async () => {
    const prisma = getTestPrisma();
    const rh = await prisma.user.findUniqueOrThrow({ where: { email: "rh@techcorp.com" } });
    const other = await prisma.patient.findFirstOrThrow({
      where: { tenantId: rh.tenantId, companyId: { not: rh.companyId } },
    });

    await setSessionForEmail("rh@techcorp.com");
    const res = await pjBeneficiaryPatch(
      jsonRequest(`http://localhost/api/pj/beneficiaries/${other.id}`, {
        method: "PATCH",
        body: { name: "Hack" },
      }),
      { params: Promise.resolve({ id: other.id }) },
    );
    expect(res.status).toBe(404);
  });

  it("retorna 403 para sessão BENEFICIARIO", async () => {
    await setSessionForEmail("joao.pereira@email.com");
    const res = await pjBeneficiariesPost(
      jsonRequest("http://localhost/api/pj/beneficiaries", {
        method: "POST",
        body: { name: "X", cpf: "39053344705", birthDate: "1990-01-01" },
      }),
    );
    expect(res.status).toBe(403);
  });
});
