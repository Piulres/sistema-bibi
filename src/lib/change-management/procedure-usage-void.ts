import "server-only";
import { getPrisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import { recordTimelineEvent, TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline";
import { dispatchWebhooks } from "@/lib/webhook-service";

/** Remove uso de procedimento não faturado (pré-fechamento de fatura). */
export async function voidProcedureUsage(input: {
  tenantId: string;
  usageId: string;
  createdBy: string;
  reason?: string;
}) {
  const prisma = await getPrisma();
  const usage = await prisma.procedureUsage.findFirst({
    where: {
      id: input.usageId,
      billed: false,
      appointment: { tenantId: input.tenantId },
    },
    include: {
      procedure: { select: { code: true, name: true } },
      appointment: { include: { patient: { select: { name: true } } } },
    },
  });
  if (!usage) return null;
  if (usage.billed) {
    return { error: "Procedimento já faturado não pode ser removido" as const };
  }

  await prisma.procedureUsage.delete({ where: { id: usage.id } });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.PROCEDURE_USAGE,
    entityId: usage.id,
    action: TIMELINE_ACTIONS.VOIDED,
    description: `Uso removido: ${usage.procedure.code} — ${usage.appointment.patient.name} (${formatBRL(usage.priceCharged)})`,
    createdBy: input.createdBy,
    reversible: false,
  });

  void dispatchWebhooks({
    tenantId: input.tenantId,
    event: "ENTITY_REVERTED",
    data: { entityType: "ProcedureUsage", entityId: usage.id, action: "VOIDED" },
  });

  return { ok: true as const };
}
