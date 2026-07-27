import { describe, expect, it } from "vitest";
import { getTestPrisma } from "../helpers/db";
import { chargePrice } from "../../prisma/seed-data/pricing-market";
import {
  OPERATION_MONTH_MARKER,
  buildOperationMonthPlan,
  operationMonthWindow,
} from "../../prisma/seed-data/operation-month";
import { TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline-constants";
import {
  civilDateISO,
  dayRangeInAppTz,
  endOfDayInAppTz,
  shiftCivilDate,
  startOfDayInAppTz,
} from "@/lib/timezone";

/**
 * Consistência do mês operacional semeado em `runDatabaseSeed`.
 * Datas são relativas — a janela "sempre atual" é revalidada a cada seed.
 */
describe("Mês operacional — consistência da timeline e do dia a dia", () => {
  const prisma = getTestPrisma();
  const { from, to } = operationMonthWindow();
  const plan = buildOperationMonthPlan();

  async function horizonte() {
    return prisma.tenant.findFirstOrThrow({ where: { slug: "horizonte" } });
  }

  it("seed inclui marcador do mês operacional com densidade mínima na janela", async () => {
    const tenant = await horizonte();
    const marked = await prisma.appointment.count({
      where: {
        tenantId: tenant.id,
        reason: { contains: OPERATION_MONTH_MARKER },
        scheduledAt: { gte: from, lte: to },
      },
    });
    expect(marked).toBeGreaterThanOrEqual(Math.min(50, plan.slots.length - 5));
    expect(marked).toBeGreaterThanOrEqual(40);
  });

  it("status: passado tem REALIZADO/FALTOU/CANCELADO; futuro só AGENDADO/CONFIRMADO", async () => {
    const tenant = await horizonte();
    // "Futuro" = após o fim do dia civil BRT — evita falso positivo em CI UTC
    // quando slots de hoje (REALIZADO) ainda estão à frente de `new Date()`.
    const startToday = startOfDayInAppTz();
    const endToday = endOfDayInAppTz();

    const futureRealizado = await prisma.appointment.count({
      where: {
        tenantId: tenant.id,
        reason: { contains: OPERATION_MONTH_MARKER },
        scheduledAt: { gt: endToday },
        status: "REALIZADO",
      },
    });
    expect(futureRealizado).toBe(0);

    const pastStatuses = await prisma.appointment.groupBy({
      by: ["status"],
      where: {
        tenantId: tenant.id,
        reason: { contains: OPERATION_MONTH_MARKER },
        scheduledAt: { gte: from, lt: startToday },
      },
      _count: true,
    });
    const byStatus = Object.fromEntries(pastStatuses.map((r) => [r.status, r._count]));
    expect(byStatus.REALIZADO ?? 0).toBeGreaterThan(0);
    expect((byStatus.FALTOU ?? 0) + (byStatus.CANCELADO ?? 0)).toBeGreaterThan(0);
  });

  it("fontes diversas: walk-in, corporativo, autosserviço e particular", async () => {
    const tenant = await horizonte();
    const reasons = await prisma.appointment.findMany({
      where: {
        tenantId: tenant.id,
        reason: { contains: OPERATION_MONTH_MARKER },
      },
      select: { reason: true, patient: { select: { companyId: true } } },
      take: 200,
    });
    const joined = reasons.map((r) => r.reason ?? "").join("\n");
    expect(joined).toContain("walk-in");
    expect(joined).toContain("corporativa");
    expect(joined).toContain("Autosserviço");
    expect(joined).toContain("Particular");
    expect(reasons.some((r) => r.patient.companyId == null)).toBe(true);
    expect(reasons.some((r) => r.patient.companyId != null)).toBe(true);
  });

  it("múltiplos médicos atendem na janela do mês", async () => {
    const tenant = await horizonte();
    const grouped = await prisma.appointment.groupBy({
      by: ["providerId"],
      where: {
        tenantId: tenant.id,
        reason: { contains: OPERATION_MONTH_MARKER },
        scheduledAt: { gte: from, lte: to },
      },
      _count: true,
    });
    expect(grouped.length).toBeGreaterThanOrEqual(2);
  });

  it("agenda de hoje tem slots do mês operacional (timeline sempre atual)", async () => {
    const tenant = await horizonte();
    const todayISO = civilDateISO();
    // Domingo BRT o plano não gera slots — valida o sábado anterior.
    const probeISO =
      new Date(`${todayISO}T12:00:00-03:00`).getUTCDay() === 0
        ? shiftCivilDate(todayISO, -1)
        : todayISO;
    const { from: dayStart, to: dayEnd } = dayRangeInAppTz(probeISO);
    const isSundayFallback = probeISO !== todayISO;

    const todayCount = await prisma.appointment.count({
      where: {
        tenantId: tenant.id,
        reason: { contains: OPERATION_MONTH_MARKER },
        scheduledAt: { gte: dayStart, lte: dayEnd },
      },
    });
    expect(todayCount).toBeGreaterThanOrEqual(isSundayFallback ? 1 : 2);

    const timelineToday = await prisma.timelineEvent.count({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: dayStart, lte: dayEnd },
        OR: [
          { action: TIMELINE_ACTIONS.CREATED },
          { action: TIMELINE_ACTIONS.APPOINTMENT_COMPLETED },
          { action: TIMELINE_ACTIONS.PROCEDURE_REGISTERED },
        ],
      },
    });
    expect(timelineToday).toBeGreaterThan(0);
  });

  it("descontos corporativos: PPU corporativo ≤ base em categoria com regra", async () => {
    const tenant = await horizonte();
    const usage = await prisma.procedureUsage.findFirst({
      where: {
        billed: true,
        appointment: {
          tenantId: tenant.id,
          reason: { contains: OPERATION_MONTH_MARKER },
          patient: { companyId: { not: null } },
        },
        procedure: { category: { in: ["CONSULTA", "OCUPACIONAL"] } },
      },
      include: {
        procedure: true,
        appointment: { include: { patient: true } },
      },
    });
    expect(usage).toBeTruthy();
    expect(usage!.priceCharged).toBeLessThanOrEqual(usage!.procedure.basePrice);

    const company = await prisma.company.findUniqueOrThrow({
      where: { id: usage!.appointment.patient.companyId! },
    });
    const rule = await prisma.pricingRule.findFirst({
      where: {
        companyId: company.id,
        procedureId: usage!.procedureId,
      },
    });
    if (rule) {
      const expected = Math.round(usage!.procedure.basePrice * rule.multiplier * 100) / 100;
      expect(usage!.priceCharged).toBe(expected);
    }
  });

  it("PPU faturado tem InvoiceItem; há usos não faturados para jornada aberta", async () => {
    const tenant = await horizonte();
    const billed = await prisma.procedureUsage.findMany({
      where: {
        billed: true,
        appointment: {
          tenantId: tenant.id,
          reason: { contains: OPERATION_MONTH_MARKER },
        },
      },
      select: { id: true },
      take: 30,
    });
    expect(billed.length).toBeGreaterThan(0);
    for (const u of billed.slice(0, 10)) {
      const item = await prisma.invoiceItem.findFirst({ where: { usageId: u.id } });
      expect(item, `usage ${u.id} sem InvoiceItem`).toBeTruthy();
    }

    const unbilled = await prisma.procedureUsage.count({
      where: {
        billed: false,
        appointment: {
          tenantId: tenant.id,
          reason: { contains: OPERATION_MONTH_MARKER },
        },
      },
    });
    expect(unbilled).toBeGreaterThan(0);
  });

  it("PEP e baixa de estoque presentes na janela", async () => {
    const tenant = await horizonte();
    const pep = await prisma.medicalRecord.count({
      where: {
        appointment: {
          tenantId: tenant.id,
          reason: { contains: OPERATION_MONTH_MARKER },
          scheduledAt: { gte: from, lte: to },
        },
      },
    });
    expect(pep).toBeGreaterThan(0);

    const stock = await prisma.stockMovement.count({
      where: {
        tenantId: tenant.id,
        type: "SAIDA",
        reason: { contains: OPERATION_MONTH_MARKER },
        createdAt: { gte: from, lte: to },
      },
    });
    expect(stock).toBeGreaterThan(0);
  });

  it("timeline: CREATED, PROCEDURE_REGISTERED, INVOICE_* na janela do mês", async () => {
    const tenant = await horizonte();
    const actions = [
      TIMELINE_ACTIONS.CREATED,
      TIMELINE_ACTIONS.PROCEDURE_REGISTERED,
      TIMELINE_ACTIONS.INVOICE_ISSUED,
      TIMELINE_ACTIONS.INVOICE_PAID,
      TIMELINE_ACTIONS.APPOINTMENT_COMPLETED,
    ] as const;

    for (const action of actions) {
      const count = await prisma.timelineEvent.count({
        where: {
          tenantId: tenant.id,
          action,
          createdAt: { gte: from, lte: to },
        },
      });
      expect(count, `action ${action}`).toBeGreaterThan(0);
    }

    const auditTotal = await prisma.timelineEvent.count({
      where: { tenantId: tenant.id, createdAt: { gte: from, lte: to } },
    });
    expect(auditTotal).toBeGreaterThan(20);
  });

  it("CEDIG: launches do mês com tabelas diversas e bridge SYNCED", async () => {
    const cedig = await prisma.tenant.findUnique({ where: { slug: "cedig" } });
    expect(cedig).toBeTruthy();

    const launches = await prisma.clinicExamLaunch.findMany({
      where: {
        tenantId: cedig!.id,
        notes: { contains: OPERATION_MONTH_MARKER },
      },
      select: {
        priceTable: true,
        paymentMethod: true,
        bridgeStatus: true,
        appointmentId: true,
        usageId: true,
        invoiceId: true,
      },
    });
    expect(launches.length).toBeGreaterThanOrEqual(8);
    const tables = new Set(launches.map((l) => l.priceTable));
    expect(tables.size).toBeGreaterThanOrEqual(2);
    expect(launches.some((l) => l.paymentMethod === "CONVENIO")).toBe(true);
    expect(launches.some((l) => l.paymentMethod !== "CONVENIO")).toBe(true);

    const synced = launches.filter((l) => l.bridgeStatus === "SYNCED");
    expect(synced.length).toBeGreaterThan(0);
    expect(
      synced.every((l) => l.appointmentId && l.usageId && l.invoiceId),
    ).toBe(true);

    const expenses = await prisma.clinicExpense.count({
      where: {
        tenantId: cedig!.id,
        description: { contains: OPERATION_MONTH_MARKER },
      },
    });
    expect(expenses).toBeGreaterThanOrEqual(4);
  });

  it("chargePrice do plano bate com descontos do seed (amostra corporativa)", async () => {
    const tenant = await horizonte();
    const companies = await prisma.company.findMany({
      where: { tenantId: tenant.id },
      take: 5,
      include: { pricingRules: { take: 2, include: { procedure: true } } },
    });
    const withRule = companies.find((c) => c.pricingRules.length > 0);
    if (!withRule) return;

    const rule = withRule.pricingRules[0]!;
    const discounts = new Map<number, number>([[1, rule.multiplier]]);
    const computed = chargePrice(
      rule.procedure.category,
      rule.procedure.basePrice,
      1,
      discounts,
    );
    expect(computed).toBe(
      Math.round(rule.procedure.basePrice * rule.multiplier * 100) / 100,
    );
  });

  it("eventos de estoque dispensado aparecem na auditoria do tenant", async () => {
    const tenant = await horizonte();
    const dispensed = await prisma.timelineEvent.count({
      where: {
        tenantId: tenant.id,
        entityType: TIMELINE_ENTITY_TYPES.STOCK_MOVEMENT,
        action: TIMELINE_ACTIONS.STOCK_DISPENSED,
        createdAt: { gte: from, lte: to },
      },
    });
    expect(dispensed).toBeGreaterThan(0);
  });
});
