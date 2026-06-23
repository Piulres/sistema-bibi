import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as auditGet } from "@/app/api/interno/audit/route";
import { GET as pricingGet, POST as pricingPost } from "@/app/api/interno/pricing-rules/route";
import { PATCH as subscriptionPatch } from "@/app/api/interno/subscriptions/[id]/route";
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

describe("Auditoria e precificação", () => {
  afterEach(() => {
    clearSessionMock();
  });

  it("GET /api/interno/audit retorna eventos paginados", async () => {
    await setSessionForEmail("faturamento@bibi.health");
    const res = await auditGet(
      jsonRequest("http://localhost/api/interno/audit?page=1&limit=10"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.events).toBeInstanceOf(Array);
    expect(body.total).toBeGreaterThanOrEqual(0);
    expect(body.filters.entityTypes.length).toBeGreaterThan(0);
  });

  it("FATURAMENTO acessa auditoria", async () => {
    await setSessionForEmail("financeiro@bibi.health");
    const res = await auditGet(jsonRequest("http://localhost/api/interno/audit"));
    expect(res.status).toBe(200);
  });

  it("RECEPCAO não acessa auditoria", async () => {
    await setSessionForEmail("recepcao@bibi.health");
    const res = await auditGet(jsonRequest("http://localhost/api/interno/audit"));
    expect(res.status).toBe(403);
  });

  it("CRUD pricing rule e evento na timeline", async () => {
    const prisma = getTestPrisma();
    const interno = await prisma.user.findUniqueOrThrow({
      where: { email: "faturamento@bibi.health" },
    });
    const company = await prisma.company.findFirst({
      where: { tenantId: interno.tenantId },
    });
    const procedure = await prisma.procedure.findFirst({
      where: {
        tenantId: interno.tenantId,
        NOT: { pricingRules: { some: { companyId: company?.id ?? "" } } },
      },
    });
    if (!company || !procedure) return;

    await prisma.pricingRule.deleteMany({
      where: { companyId: company.id, procedureId: procedure.id },
    });

    await setSessionForEmail("faturamento@bibi.health");
    const createRes = await pricingPost(
      jsonRequest("http://localhost/api/interno/pricing-rules", {
        method: "POST",
        body: {
          companyId: company!.id,
          procedureId: procedure!.id,
          multiplier: 0.9,
          description: "Teste unitário precificação",
        },
      }),
    );
    expect(createRes.status).toBe(200);
    const created = await createRes.json();
    const ruleId = created.rule.id as string;

    const events = await prisma.timelineEvent.findMany({
      where: { entityType: "PricingRule", entityId: ruleId },
    });
    expect(events.length).toBeGreaterThan(0);

    const listRes = await pricingGet();
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.rules.some((r: { id: string }) => r.id === ruleId)).toBe(true);
  });

  it("PATCH assinatura atualiza valor e cobranças pendentes", async () => {
    const prisma = getTestPrisma();
    const sub = await prisma.subscription.findFirst({ where: { status: "ATIVA" } });
    expect(sub).toBeTruthy();

    await prisma.subscriptionCharge.create({
      data: {
        subscriptionId: sub!.id,
        dueDate: new Date(Date.now() + 86400000 * 30),
        amount: sub!.amount,
        status: "PENDENTE",
      },
    });

    await setSessionForEmail("faturamento@bibi.health");
    const newAmount = sub!.amount + 10;
    const res = await subscriptionPatch(
      jsonRequest(`http://localhost/api/interno/subscriptions/${sub!.id}`, {
        method: "PATCH",
        body: { amount: newAmount },
      }),
      { params: Promise.resolve({ id: sub!.id }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.subscription.amount).toBe(newAmount);

    const pending = await prisma.subscriptionCharge.findMany({
      where: { subscriptionId: sub!.id, status: "PENDENTE", invoiceId: null },
    });
    expect(pending.every((c) => c.amount === newAmount)).toBe(true);
  });
});
