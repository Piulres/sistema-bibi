import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as clinicalGet } from "@/app/api/interno/patients/[id]/clinical/route";
import { GET as overviewGet } from "@/app/api/interno/patients/[id]/overview/route";
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

describe("Cliente 360° — RBAC clínico impede vazamento via cadastros", () => {
  afterEach(() => {
    clearSessionMock();
  });

  it("RECEPCAO recebe overview sem medicalRecords.content — evita backdoor de PEP", async () => {
    const prisma = getTestPrisma();
    const reception = await prisma.user.findUniqueOrThrow({
      where: { email: "recepcao@bibi.health" },
    });
    const patient = await prisma.patient.findFirstOrThrow({
      where: {
        tenantId: reception.tenantId,
        medicalRecords: { some: {} },
      },
      include: { medicalRecords: { take: 1 } },
    });
    expect(patient.medicalRecords.length).toBeGreaterThan(0);

    await setSessionForEmail("recepcao@bibi.health");
    const res = await overviewGet(jsonRequest("http://localhost/api/interno/patients/x/overview"), {
      params: Promise.resolve({ id: patient.id }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.overview.summary.totalRecords).toBeGreaterThan(0);
    expect(body.overview.medicalRecords).toEqual([]);
  });

  it("RECEPCAO não acessa GET /clinical — detalhe clínico só ADMIN", async () => {
    const prisma = getTestPrisma();
    const reception = await prisma.user.findUniqueOrThrow({
      where: { email: "recepcao@bibi.health" },
    });
    const patient = await prisma.patient.findFirstOrThrow({
      where: { tenantId: reception.tenantId },
    });

    await setSessionForEmail("recepcao@bibi.health");
    const res = await clinicalGet(jsonRequest("http://localhost/api/interno/patients/x/clinical"), {
      params: Promise.resolve({ id: patient.id }),
    });
    expect(res.status).toBe(403);
  });

  it("ADMIN acessa GET /clinical e overview com registros", async () => {
    const prisma = getTestPrisma();
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: "faturamento@bibi.health" },
    });
    const patient = await prisma.patient.findFirstOrThrow({
      where: {
        tenantId: admin.tenantId,
        medicalRecords: { some: {} },
      },
    });

    await setSessionForEmail("faturamento@bibi.health");
    const clinicalRes = await clinicalGet(
      jsonRequest("http://localhost/api/interno/patients/x/clinical"),
      { params: Promise.resolve({ id: patient.id }) },
    );
    expect(clinicalRes.status).toBe(200);
    const clinicalBody = await clinicalRes.json();
    expect(clinicalBody.clinical).toBeTruthy();

    const overviewRes = await overviewGet(
      jsonRequest("http://localhost/api/interno/patients/x/overview"),
      { params: Promise.resolve({ id: patient.id }) },
    );
    expect(overviewRes.status).toBe(200);
    const overviewBody = await overviewRes.json();
    expect(overviewBody.overview.medicalRecords.length).toBeGreaterThan(0);
    expect(overviewBody.overview.medicalRecords[0].content).toBeTruthy();
  });
});
