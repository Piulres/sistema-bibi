import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as auditGet } from "@/app/api/interno/audit/route";
import { PATCH as patientPatch } from "@/app/api/interno/patients/[id]/route";
import { PATCH as companyPatch } from "@/app/api/interno/companies/[id]/route";
import { PUT as pricingPut } from "@/app/api/interno/pricing-rules/[id]/route";
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

describe("Auditoria — metadata before/after (Pacote A)", () => {
  afterEach(() => {
    clearSessionMock();
  });

  it("atualização de beneficiário grava diff na timeline", async () => {
    const prisma = getTestPrisma();
    const patient = await prisma.patient.findFirstOrThrow({
      where: { cpf: "111.222.333-44" },
    });
    const originalName = patient.name;

    await setSessionForEmail("faturamento@bibi.health");
    const patchRes = await patientPatch(
      jsonRequest(`http://localhost/api/interno/patients/${patient.id}`, {
        method: "PATCH",
        body: { name: `${originalName} (rev)` },
      }),
      { params: Promise.resolve({ id: patient.id }) },
    );
    expect(patchRes.status).toBe(200);

    const event = await prisma.timelineEvent.findFirst({
      where: {
        entityType: "Patient",
        entityId: patient.id,
        action: "UPDATED",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(event?.metadata).toBeTruthy();
    expect(event?.reversible).toBe(true);
    const meta = JSON.parse(event!.metadata!);
    expect(meta.fieldsChanged).toContain("name");
    expect(meta.before.name).toBe(originalName);

    await patientPatch(
      jsonRequest(`http://localhost/api/interno/patients/${patient.id}`, {
        method: "PATCH",
        body: { name: originalName },
      }),
      { params: Promise.resolve({ id: patient.id }) },
    );
  });

  it("atualização de empresa grava diff na timeline", async () => {
    const prisma = getTestPrisma();
    const company = await prisma.company.findFirstOrThrow({
      where: { name: { contains: "TechCorp" } },
    });
    const nextTradeName =
      company.tradeName === "TechCorp Holdings QA"
        ? "TechCorp Holdings Alt"
        : "TechCorp Holdings QA";

    await setSessionForEmail("faturamento@bibi.health");
    const patchRes = await companyPatch(
      jsonRequest(`http://localhost/api/interno/companies/${company.id}`, {
        method: "PATCH",
        body: { tradeName: nextTradeName },
      }),
      { params: Promise.resolve({ id: company.id }) },
    );
    expect(patchRes.status).toBe(200);

    const event = await prisma.timelineEvent.findFirst({
      where: {
        entityType: "Company",
        entityId: company.id,
        action: "UPDATED",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(event?.metadata).toBeTruthy();
    const meta = JSON.parse(event!.metadata!);
    expect(meta.fieldsChanged).toContain("tradeName");
    expect(meta.after.tradeName).toBe(nextTradeName);
  });

  it("GET /api/interno/audit expõe hasDiff e metadata parseado", async () => {
    const prisma = getTestPrisma();
    const interno = await prisma.user.findUniqueOrThrow({
      where: { email: "faturamento@bibi.health" },
    });
    const company = await prisma.company.findFirstOrThrow({
      where: { tenantId: interno.tenantId },
    });

    await setSessionForEmail("faturamento@bibi.health");
    const nextPhone = company.phone === "1133334444" ? "1144445555" : "1133334444";
    await companyPatch(
      jsonRequest(`http://localhost/api/interno/companies/${company.id}`, {
        method: "PATCH",
        body: { phone: nextPhone },
      }),
      { params: Promise.resolve({ id: company.id }) },
    );

    const res = await auditGet(
      jsonRequest(
        "http://localhost/api/interno/audit?entityType=Company&action=UPDATED&limit=5",
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    const withDiff = body.events.find(
      (e: { entityId: string; hasDiff: boolean }) =>
        e.entityId === company.id && e.hasDiff,
    );
    expect(withDiff).toBeTruthy();
    expect(withDiff.metadata?.fieldsChanged).toContain("phone");
  });

  it("atualização de regra de precificação grava diff", async () => {
    const prisma = getTestPrisma();
    const rule = await prisma.pricingRule.findFirst({
      include: { procedure: true },
    });
    if (!rule) return;

    await setSessionForEmail("faturamento@bibi.health");
    const newMultiplier = rule.multiplier === 0.85 ? 0.9 : 0.85;
    const patchRes = await pricingPut(
      jsonRequest(`http://localhost/api/interno/pricing-rules/${rule.id}`, {
        method: "PUT",
        body: { multiplier: newMultiplier },
      }),
      { params: Promise.resolve({ id: rule.id }) },
    );
    expect(patchRes.status).toBe(200);

    const event = await prisma.timelineEvent.findFirst({
      where: {
        entityType: "PricingRule",
        entityId: rule.id,
        action: "UPDATED",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(event?.metadata).toBeTruthy();
    const meta = JSON.parse(event!.metadata!);
    expect(meta.fieldsChanged).toContain("multiplier");
    expect(meta.after.multiplier).toBe(newMultiplier);
  });
});
