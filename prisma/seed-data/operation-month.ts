/**
 * Mês operacional do consultório — massa densa e sempre atual (datas relativas).
 * Complementa seedOperationalMass (histórico esparso) com agenda/PPU/PEP/estoque/
 * faturas/timeline + CEDIG launches/despesas na janela de ~30 dias.
 */
import type { PrismaClient } from "@prisma/client";
import {
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "../../src/lib/timeline";
import {
  civilDateISO,
  parseAppDateTime,
  shiftCivilDate,
} from "../../src/lib/timezone";
import { chargePrice } from "./pricing-market";
import { pick, demoCpf, phoneForIndex, birthDateForAge } from "./helpers";
import { MEDICAL_RECORD_SNIPPETS } from "./catalog";
import {
  OPERATION_MONTH_MARKER,
  buildOperationMonthPlan,
  type OperationMonthPlan,
  type OperationMonthSlot,
} from "./operation-month-plan";

const OPERATION_MONTH_PARTICULARS = [
  { name: "Carla Ribeiro", salt: 901 },
  { name: "Roberto Almeida", salt: 902 },
  { name: "Helena Costa", salt: 903 },
  { name: "Tiago Nunes", salt: 904 },
] as const;

export type { OperationMonthPlan } from "./operation-month-plan";
export {
  OPERATION_MONTH_MARKER,
  buildOperationMonthPlan,
  operationMonthWindow,
  OPERATION_MONTH_PAST_DAYS,
  OPERATION_MONTH_FUTURE_DAYS,
} from "./operation-month-plan";

export type OperationMonthStats = {
  appointments: number;
  procedureUsages: number;
  medicalRecords: number;
  invoices: number;
  payments: number;
  stockMovements: number;
  timelineEvents: number;
  cedigLaunches: number;
  cedigExpenses: number;
  skipped: boolean;
};

type PatientRef = {
  id: string;
  name: string;
  companyId: string | null;
  companyIndex: number;
};

type ProcedureRef = {
  id: string;
  basePrice: number;
  name: string;
  code: string;
  category: string;
};

export type SeedClinicOperationMonthContext = {
  prisma: PrismaClient;
  tenantId: string;
  procedures: Record<string, ProcedureRef>;
  providerIds: string[];
  internoId: string;
  patients: PatientRef[];
  discountByCompanyIndex: Map<number, number>;
  /** Quando false, não cria launches CEDIG (tenant sem CEDIG). Default: tenta. */
  includeCedig?: boolean;
};

/** Instante UTC correspondente a dayOffset + HH:mm no calendário civil BRT. */
function atOffset(dayOffset: number, hour: number, minute: number): Date {
  const dateISO = shiftCivilDate(civilDateISO(), dayOffset);
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return parseAppDateTime(dateISO, `${hh}:${mm}`);
}

function pickPatient(
  patients: PatientRef[],
  slot: OperationMonthSlot,
): PatientRef | null {
  const pool =
    slot.patientPool === "particular"
      ? patients.filter((p) => p.companyId == null)
      : patients.filter((p) => p.companyId != null);
  const list = pool.length > 0 ? pool : patients;
  if (list.length === 0) return null;
  return list[slot.companyIndexSalt % list.length]!;
}

async function alreadySeeded(prisma: PrismaClient, tenantId: string): Promise<boolean> {
  const hit = await prisma.appointment.findFirst({
    where: { tenantId, reason: { contains: OPERATION_MONTH_MARKER } },
    select: { id: true },
  });
  return Boolean(hit);
}

/**
 * Aplica o plano do mês operacional no tenant Horizonte (e CEDIG se existir).
 * Idempotente via marcador `[seed-operation-month]` nos reasons/notes.
 */
export async function seedClinicOperationMonth(
  ctx: SeedClinicOperationMonthContext,
  plan: OperationMonthPlan = buildOperationMonthPlan(),
): Promise<OperationMonthStats> {
  const stats: OperationMonthStats = {
    appointments: 0,
    procedureUsages: 0,
    medicalRecords: 0,
    invoices: 0,
    payments: 0,
    stockMovements: 0,
    timelineEvents: 0,
    cedigLaunches: 0,
    cedigExpenses: 0,
    skipped: false,
  };

  if (await alreadySeeded(ctx.prisma, ctx.tenantId)) {
    stats.skipped = true;
    return stats;
  }

  if (ctx.providerIds.length === 0 || ctx.patients.length === 0) {
    return stats;
  }

  const patients = [...ctx.patients];
  for (let i = 0; i < OPERATION_MONTH_PARTICULARS.length; i++) {
    const def = OPERATION_MONTH_PARTICULARS[i]!;
    const cpf = demoCpf(def.salt);
    const existing = await ctx.prisma.patient.findUnique({ where: { cpf } });
    if (existing) {
      if (!patients.some((p) => p.id === existing.id)) {
        patients.push({
          id: existing.id,
          name: existing.name,
          companyId: existing.companyId,
          companyIndex: 0,
        });
      }
      continue;
    }
    const created = await ctx.prisma.patient.create({
      data: {
        name: def.name,
        cpf,
        birthDate: birthDateForAge(30 + i * 5, def.salt),
        email: `opm.particular${i}@beneficiario.demo`,
        phone: phoneForIndex(8000 + i),
        companyId: null,
        tenantId: ctx.tenantId,
        consentAt: new Date(),
        consentVersion: "v1-poc",
      },
    });
    patients.push({
      id: created.id,
      name: created.name,
      companyId: null,
      companyIndex: 0,
    });
  }

  const kitItems = await ctx.prisma.procedureMaterialKit.findMany({
    where: { tenantId: ctx.tenantId },
    include: {
      product: {
        include: {
          lots: {
            where: { status: "DISPONIVEL", quantity: { gt: 0 } },
            orderBy: { expiryDate: "asc" },
            take: 1,
          },
        },
      },
    },
  });
  const kitByProcedure = new Map<string, typeof kitItems>();
  for (const item of kitItems) {
    const list = kitByProcedure.get(item.procedureId) ?? [];
    list.push(item);
    kitByProcedure.set(item.procedureId, list);
  }

  type PendingBill = {
    usageId: string;
    patient: PatientRef;
    amount: number;
    description: string;
    performedAt: Date;
    invoiceStatus: "ABERTA" | "FECHADA" | "PAGA";
  };
  const pendingBills: PendingBill[] = [];

  for (const slot of plan.slots) {
    const patient = pickPatient(patients, slot);
    const proc = ctx.procedures[slot.procedureCode];
    if (!patient || !proc) continue;

    const providerId = ctx.providerIds[slot.slotIndex % ctx.providerIds.length]!;
    const scheduledAt = atOffset(slot.dayOffset, slot.hour, slot.minute);

    const appointment = await ctx.prisma.appointment.create({
      data: {
        scheduledAt,
        status: slot.status,
        modality: slot.modality,
        telemedicineUrl:
          slot.modality === "TELE"
            ? `https://meet.bibi.health/room/opm-${slot.slotIndex}`
            : null,
        reason: slot.reasonLabel,
        tenantId: ctx.tenantId,
        patientId: patient.id,
        providerId,
        procedureId: proc.id,
      },
    });
    stats.appointments += 1;

    await ctx.prisma.timelineEvent.create({
      data: {
        tenantId: ctx.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.APPOINTMENT,
        entityId: appointment.id,
        action: TIMELINE_ACTIONS.CREATED,
        description: `Agendamento ${slot.source} — ${patient.name} (${proc.code})`,
        createdBy: ctx.internoId,
        createdAt: scheduledAt,
        correlationId:
          slot.source === "WALK_IN" ? `walkin-opm-${slot.slotIndex}` : null,
      },
    });
    stats.timelineEvents += 1;

    if (slot.status === "REALIZADO") {
      await ctx.prisma.timelineEvent.create({
        data: {
          tenantId: ctx.tenantId,
          entityType: TIMELINE_ENTITY_TYPES.APPOINTMENT,
          entityId: appointment.id,
          action: TIMELINE_ACTIONS.APPOINTMENT_COMPLETED,
          description: `Consulta realizada — ${patient.name}`,
          createdBy: providerId,
          createdAt: scheduledAt,
        },
      });
      stats.timelineEvents += 1;
    }

    if (slot.withUsage && slot.status === "REALIZADO") {
      const charged = chargePrice(
        proc.category,
        proc.basePrice,
        patient.companyIndex,
        ctx.discountByCompanyIndex,
      );
      const usage = await ctx.prisma.procedureUsage.create({
        data: {
          appointmentId: appointment.id,
          procedureId: proc.id,
          priceCharged: charged,
          billed: slot.billed,
          performedAt: scheduledAt,
        },
      });
      stats.procedureUsages += 1;

      await ctx.prisma.timelineEvent.create({
        data: {
          tenantId: ctx.tenantId,
          entityType: TIMELINE_ENTITY_TYPES.PROCEDURE_USAGE,
          entityId: usage.id,
          action: TIMELINE_ACTIONS.PROCEDURE_REGISTERED,
          description: `PPU ${proc.name} — ${charged.toFixed(2)} (${patient.name})`,
          createdBy: providerId,
          createdAt: scheduledAt,
        },
      });
      stats.timelineEvents += 1;

      if (slot.billed && slot.invoiceStatus) {
        pendingBills.push({
          usageId: usage.id,
          patient,
          amount: charged,
          description: proc.name,
          performedAt: scheduledAt,
          invoiceStatus: slot.invoiceStatus,
        });
      }

      if (slot.dispenseStock) {
        const kits = kitByProcedure.get(proc.id) ?? [];
        for (const kit of kits) {
          const lot = kit.product.lots[0];
          if (!lot) continue;
          const qty = Math.min(kit.quantity, lot.quantity);
          if (qty <= 0) continue;
          await ctx.prisma.stockLot.update({
            where: { id: lot.id },
            data: { quantity: { decrement: qty } },
          });
          lot.quantity -= qty;
          await ctx.prisma.stockMovement.create({
            data: {
              tenantId: ctx.tenantId,
              productId: kit.productId,
              lotId: lot.id,
              type: "SAIDA",
              quantity: qty,
              reason: `${OPERATION_MONTH_MARKER} Dispensa kit ${proc.code} · slot ${slot.slotIndex}`,
              appointmentId: appointment.id,
              patientId: patient.id,
              procedureUsageId: usage.id,
              createdBy: providerId,
              createdAt: scheduledAt,
            },
          });
          await ctx.prisma.timelineEvent.create({
            data: {
              tenantId: ctx.tenantId,
              entityType: TIMELINE_ENTITY_TYPES.STOCK_MOVEMENT,
              entityId: lot.id,
              action: TIMELINE_ACTIONS.STOCK_DISPENSED,
              description: `Baixa estoque ${kit.product.sku} × ${qty}`,
              createdBy: providerId,
              createdAt: scheduledAt,
            },
          });
          stats.stockMovements += 1;
          stats.timelineEvents += 1;
        }
      }
    }

    if (slot.withPep && slot.status === "REALIZADO") {
      const record = await ctx.prisma.medicalRecord.create({
        data: {
          recordType: slot.slotIndex % 7 === 0 ? "ATESTADO" : "EVOLUCAO",
          title: slot.slotIndex % 7 === 0 ? "Atestado médico" : null,
          content: pick(MEDICAL_RECORD_SNIPPETS, slot.slotIndex),
          patientId: patient.id,
          providerId,
          appointmentId: appointment.id,
          createdAt: scheduledAt,
        },
      });
      stats.medicalRecords += 1;

      await ctx.prisma.timelineEvent.create({
        data: {
          tenantId: ctx.tenantId,
          entityType: TIMELINE_ENTITY_TYPES.MEDICAL_RECORD,
          entityId: record.id,
          action: TIMELINE_ACTIONS.MEDICAL_RECORD_CREATED,
          description: `PEP registrado — ${patient.name}`,
          createdBy: providerId,
          createdAt: scheduledAt,
        },
      });
      stats.timelineEvents += 1;
    }
  }

  for (const bill of pendingBills) {
    const invoice = await ctx.prisma.invoice.create({
      data: {
        tenantId: ctx.tenantId,
        patientId: bill.patient.id,
        companyId: bill.patient.companyId,
        total: bill.amount,
        status: bill.invoiceStatus,
        createdAt: bill.performedAt,
        items: {
          create: [
            {
              description: bill.description,
              amount: bill.amount,
              usageId: bill.usageId,
            },
          ],
        },
      },
    });
    stats.invoices += 1;

    await ctx.prisma.timelineEvent.create({
      data: {
        tenantId: ctx.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.INVOICE,
        entityId: invoice.id,
        action: TIMELINE_ACTIONS.INVOICE_ISSUED,
        description: bill.patient.companyId
          ? `Fatura corporativa mês operacional — ${bill.patient.name}`
          : `Fatura particular mês operacional — ${bill.patient.name}`,
        createdBy: ctx.internoId,
        createdAt: bill.performedAt,
      },
    });
    stats.timelineEvents += 1;

    if (bill.invoiceStatus === "PAGA") {
      const paidAt = new Date(bill.performedAt.getTime() + 36 * 60 * 60 * 1000);
      await ctx.prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          method: "PIX",
          amount: bill.amount,
          status: "CONFIRMED",
          gatewayId: "mock",
          externalId: `opm-pix-${invoice.id.slice(-8)}`,
          pixCopyPaste: `00020126580014br.gov.bcb.pix0136${invoice.id.slice(-12)}`,
          qrCodePayload: `PIX|${bill.amount}|${invoice.id}`,
          paidAt,
          createdBy: ctx.internoId,
        },
      });
      stats.payments += 1;

      await ctx.prisma.timelineEvent.create({
        data: {
          tenantId: ctx.tenantId,
          entityType: TIMELINE_ENTITY_TYPES.INVOICE,
          entityId: invoice.id,
          action: TIMELINE_ACTIONS.INVOICE_PAID,
          description: `Pagamento PIX confirmado — ${bill.patient.name}`,
          createdBy: ctx.internoId,
          createdAt: paidAt,
        },
      });
      stats.timelineEvents += 1;
    } else if (bill.invoiceStatus === "FECHADA") {
      await ctx.prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          method: "PIX",
          amount: bill.amount,
          status: "PENDING",
          gatewayId: "mock",
          externalId: `opm-pix-pending-${invoice.id.slice(-8)}`,
          pixCopyPaste: `00020126580014br.gov.bcb.pix0136pending-${invoice.id.slice(-10)}`,
          createdBy: ctx.internoId,
        },
      });
      stats.payments += 1;
    }
  }

  if (ctx.includeCedig !== false) {
    const cedigStats = await seedCedigOperationMonth(ctx.prisma, plan);
    stats.cedigLaunches = cedigStats.launches;
    stats.cedigExpenses = cedigStats.expenses;
  }

  return stats;
}

async function seedCedigOperationMonth(
  prisma: PrismaClient,
  plan: OperationMonthPlan,
): Promise<{ launches: number; expenses: number }> {
  const tenant = await prisma.tenant.findUnique({ where: { slug: "cedig" } });
  if (!tenant) return { launches: 0, expenses: 0 };

  const existing = await prisma.clinicExamLaunch.findFirst({
    where: { tenantId: tenant.id, notes: { contains: OPERATION_MONTH_MARKER } },
    select: { id: true },
  });
  if (existing) return { launches: 0, expenses: 0 };

  const providers = await prisma.user.findMany({
    where: { tenantId: tenant.id, role: "PRESTADOR" },
    select: { id: true },
  });
  const patients = await prisma.patient.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, name: true },
  });
  const procedures = await prisma.procedure.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, code: true },
  });
  const procByCode = new Map(procedures.map((p) => [p.code, p.id]));

  if (providers.length === 0 || patients.length === 0) {
    return { launches: 0, expenses: 0 };
  }

  let launches = 0;
  for (const launch of plan.cedigLaunches) {
    const procedureId = procByCode.get(launch.procedureCode);
    if (!procedureId) continue;
    const patient = patients[launch.patientSalt % patients.length]!;
    const providerId = providers[launch.launchIndex % providers.length]!.id;
    const performedAt = atOffset(launch.dayOffset, launch.hour, 0);

    await prisma.clinicExamLaunch.create({
      data: {
        tenantId: tenant.id,
        patientId: patient.id,
        patientName: patient.name,
        providerId,
        procedureId,
        performedAt,
        paymentMethod: launch.paymentMethod,
        priceTable: launch.priceTable,
        amountReceived: launch.amountReceived,
        biopsies: launch.biopsies ?? 0,
        polypectomies: launch.polypectomies ?? 0,
        notes: `${OPERATION_MONTH_MARKER} launch ${launch.launchIndex} · ${launch.priceTable}`,
      },
    });
    launches += 1;
  }

  try {
    const { bridgeUnsyncedCedigLaunches } = await import("./cedig-catalog");
    await bridgeUnsyncedCedigLaunches(prisma, tenant.id);
  } catch {
    /* bridge opcional se módulo mudar */
  }

  let expenses = 0;
  for (const exp of plan.cedigExpenses) {
    await prisma.clinicExpense.create({
      data: {
        tenantId: tenant.id,
        category: exp.category,
        description: exp.description,
        amount: exp.amount,
        expenseDate: atOffset(exp.dayOffset, 8, 0),
      },
    });
    expenses += 1;
  }

  return { launches, expenses };
}
