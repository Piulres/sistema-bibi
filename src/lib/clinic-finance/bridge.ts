import "server-only";
import { getPrisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import { consumeProcedureKit } from "@/lib/stock-service";
import {
  recordTimelineEvent,
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "@/lib/timeline";
import { normalizeCpf } from "@/lib/validation/br-documents";
import {
  CEDIG_PRICE_TABLE_COMPANY_NAME,
  generateProvisionalCpf,
  mapClinicPaymentToInvoiceMethod,
} from "@/lib/clinic-finance/bridge-helpers";
import type { CedigPriceTableId } from "@/lib/clinic-finance/cedig-pricing";

export {
  CEDIG_PRICE_TABLE_COMPANY_NAME,
  generateProvisionalCpf,
  mapClinicPaymentToInvoiceMethod,
} from "@/lib/clinic-finance/bridge-helpers";

export async function resolveCompanyIdForPriceTable(
  tenantId: string,
  priceTable: string,
): Promise<string | null> {
  const name =
    CEDIG_PRICE_TABLE_COMPANY_NAME[priceTable as CedigPriceTableId] ?? null;
  if (!name) return null;
  const prisma = await getPrisma();
  const company = await prisma.company.findFirst({
    where: { tenantId, name },
    select: { id: true },
  });
  return company?.id ?? null;
}

export async function ensureClinicPatient(input: {
  tenantId: string;
  patientId?: string | null;
  patientName: string;
  priceTable: string;
  createdById?: string | null;
}): Promise<{ patientId: string; created: boolean } | { error: string }> {
  const prisma = await getPrisma();
  const companyId = await resolveCompanyIdForPriceTable(
    input.tenantId,
    input.priceTable,
  );

  if (input.patientId) {
    const existing = await prisma.patient.findFirst({
      where: { id: input.patientId, tenantId: input.tenantId },
    });
    if (!existing) return { error: "Paciente não encontrado neste tenant." };
    if (companyId && existing.companyId !== companyId) {
      await prisma.patient.update({
        where: { id: existing.id },
        data: { companyId },
      });
    }
    return { patientId: existing.id, created: false };
  }

  const name = input.patientName.trim();
  const byName = await prisma.patient.findFirst({
    where: { tenantId: input.tenantId, name },
  });
  if (byName) {
    if (companyId && byName.companyId !== companyId) {
      await prisma.patient.update({
        where: { id: byName.id },
        data: { companyId },
      });
    }
    return { patientId: byName.id, created: false };
  }

  for (let attempt = 0; attempt < 8; attempt++) {
    const cpf = normalizeCpf(
      generateProvisionalCpf(`${input.tenantId}:${name}:${attempt}`),
    );
    const clash = await prisma.patient.findUnique({ where: { cpf } });
    if (clash) continue;
    const created = await prisma.patient.create({
      data: {
        tenantId: input.tenantId,
        name,
        cpf,
        birthDate: new Date("1990-01-01"),
        companyId,
        consentAt: new Date(),
        consentVersion: "v1-clinic-launch",
      },
    });
    await recordTimelineEvent({
      tenantId: input.tenantId,
      entityType: TIMELINE_ENTITY_TYPES.PATIENT,
      entityId: created.id,
      action: TIMELINE_ACTIONS.CREATED,
      description: `Paciente provisório ${created.name} criado a partir da gestão clínica`,
      createdBy: input.createdById ?? undefined,
    });
    return { patientId: created.id, created: true };
  }

  return { error: "Não foi possível gerar CPF provisório único." };
}

export type BridgeLaunchResult = {
  appointmentId: string | null;
  usageId: string | null;
  invoiceId: string | null;
  bridgeStatus: "SYNCED" | "PARTIAL" | "FAILED";
  bridgeNote: string | null;
};

/**
 * Ponte operação: lançamento gestão → Appointment REALIZADO + ProcedureUsage + Invoice (+ Payment se não convênio).
 */
export async function bridgeExamLaunchToOperations(input: {
  tenantId: string;
  launchId: string;
  appointmentId?: string | null;
  createdById?: string | null;
}): Promise<BridgeLaunchResult> {
  const prisma = await getPrisma();
  const launch = await prisma.clinicExamLaunch.findFirst({
    where: { id: input.launchId, tenantId: input.tenantId },
    include: {
      procedure: { select: { id: true, name: true, code: true } },
      provider: { select: { id: true, name: true } },
    },
  });
  if (!launch) {
    return {
      appointmentId: null,
      usageId: null,
      invoiceId: null,
      bridgeStatus: "FAILED",
      bridgeNote: "Lançamento não encontrado.",
    };
  }
  if (launch.appointmentId && launch.usageId && launch.invoiceId) {
    return {
      appointmentId: launch.appointmentId,
      usageId: launch.usageId,
      invoiceId: launch.invoiceId,
      bridgeStatus: "SYNCED",
      bridgeNote: "Já sincronizado.",
    };
  }

  const patientResult = await ensureClinicPatient({
    tenantId: input.tenantId,
    patientId: launch.patientId,
    patientName: launch.patientName,
    priceTable: launch.priceTable,
    createdById: input.createdById,
  });
  if ("error" in patientResult) {
    await prisma.clinicExamLaunch.update({
      where: { id: launch.id },
      data: { bridgeStatus: "FAILED", bridgeNote: patientResult.error },
    });
    return {
      appointmentId: null,
      usageId: null,
      invoiceId: null,
      bridgeStatus: "FAILED",
      bridgeNote: patientResult.error,
    };
  }

  const patientId = patientResult.patientId;
  const companyId = await resolveCompanyIdForPriceTable(
    input.tenantId,
    launch.priceTable,
  );
  const notes: string[] = [];
  if (patientResult.created) notes.push("paciente provisório criado");

  let appointmentId = launch.appointmentId;
  const preferredAppointmentId = input.appointmentId?.trim() || null;

  try {
    if (!appointmentId && preferredAppointmentId) {
      const existing = await prisma.appointment.findFirst({
        where: {
          id: preferredAppointmentId,
          tenantId: input.tenantId,
          patientId,
        },
      });
      if (existing) {
        await prisma.appointment.update({
          where: { id: existing.id },
          data: {
            status: "REALIZADO",
            providerId: launch.providerId,
            procedureId: launch.procedureId,
          },
        });
        appointmentId = existing.id;
        notes.push("agenda reutilizada");
      }
    }

    if (!appointmentId) {
      const scheduledAt = new Date(launch.performedAt);
      const created = await prisma.appointment.create({
        data: {
          tenantId: input.tenantId,
          patientId,
          providerId: launch.providerId,
          procedureId: launch.procedureId,
          scheduledAt,
          status: "REALIZADO",
          modality: "PRESENCIAL",
          reason: `Gestão clínica · ${launch.procedure.name}`,
        },
      });
      appointmentId = created.id;
      notes.push("agenda REALIZADO");
    }

    let usageId = launch.usageId;
    if (!usageId) {
      const usage = await prisma.procedureUsage.create({
        data: {
          appointmentId,
          procedureId: launch.procedureId,
          priceCharged: launch.amountReceived,
          performedAt: launch.performedAt,
          billed: false,
        },
      });
      usageId = usage.id;
      await recordTimelineEvent({
        tenantId: input.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.PROCEDURE_USAGE,
        entityId: usage.id,
        action: TIMELINE_ACTIONS.PROCEDURE_REGISTERED,
        description: `${launch.procedure.name} (gestão) — ${launch.patientName} (${formatBRL(launch.amountReceived)})`,
        createdBy: input.createdById ?? undefined,
      });
      try {
        await consumeProcedureKit({
          tenantId: input.tenantId,
          procedureId: launch.procedureId,
          appointmentId,
          patientId,
          procedureUsageId: usage.id,
          createdBy: input.createdById ?? "clinic-finance-bridge",
        });
      } catch {
        notes.push("kit estoque não consumido");
      }
    }

    let invoiceId = launch.invoiceId;
    if (!invoiceId && usageId) {
      const invoice = await prisma.invoice.create({
        data: {
          tenantId: input.tenantId,
          patientId,
          companyId,
          total: launch.amountReceived,
          status: "FECHADA",
          items: {
            create: {
              description: `${launch.procedure.name} · ${launch.patientName}`,
              amount: launch.amountReceived,
              usageId,
            },
          },
        },
      });
      invoiceId = invoice.id;
      await prisma.procedureUsage.update({
        where: { id: usageId },
        data: { billed: true },
      });
      await recordTimelineEvent({
        tenantId: input.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.INVOICE,
        entityId: invoice.id,
        action: TIMELINE_ACTIONS.INVOICE_ISSUED,
        description: `Fatura gestão clínica — ${launch.patientName} (${formatBRL(launch.amountReceived)})`,
        createdBy: input.createdById ?? undefined,
      });

      const payMethod = mapClinicPaymentToInvoiceMethod(launch.paymentMethod);
      if (launch.paymentMethod !== "CONVENIO" && launch.amountReceived > 0) {
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            method: payMethod,
            amount: launch.amountReceived,
            status: "CONFIRMED",
            paidAt: launch.performedAt,
            createdBy: input.createdById ?? undefined,
            metadata: JSON.stringify({
              source: "clinic-exam-launch",
              launchId: launch.id,
            }),
          },
        });
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: "PAGA" },
        });
        await recordTimelineEvent({
          tenantId: input.tenantId,
          entityType: TIMELINE_ENTITY_TYPES.INVOICE,
          entityId: invoice.id,
          action: TIMELINE_ACTIONS.INVOICE_PAID,
          description: `Pagamento gestão (${payMethod}) — ${launch.patientName}`,
          createdBy: input.createdById ?? undefined,
        });
        notes.push("fatura PAGA");
      } else {
        notes.push(
          companyId
            ? "fatura convênio FECHADA"
            : "fatura FECHADA sem pagamento",
        );
      }
    }

    const bridgeStatus =
      appointmentId && usageId && invoiceId ? "SYNCED" : "PARTIAL";
    const bridgeNote = notes.join(" · ") || null;

    await prisma.clinicExamLaunch.update({
      where: { id: launch.id },
      data: {
        patientId,
        appointmentId,
        usageId,
        invoiceId,
        bridgeStatus,
        bridgeNote,
      },
    });

    return { appointmentId, usageId, invoiceId, bridgeStatus, bridgeNote };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha na ponte operacional";
    await prisma.clinicExamLaunch.update({
      where: { id: launch.id },
      data: { bridgeStatus: "FAILED", bridgeNote: message },
    });
    return {
      appointmentId: appointmentId ?? null,
      usageId: null,
      invoiceId: null,
      bridgeStatus: "FAILED",
      bridgeNote: message,
    };
  }
}
