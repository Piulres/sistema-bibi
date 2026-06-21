import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/** Tipos de entidade rastreados na timeline. */
export const TIMELINE_ENTITY_TYPES = {
  USER: "User",
  PATIENT: "Patient",
  APPOINTMENT: "Appointment",
  PROCEDURE_USAGE: "ProcedureUsage",
  MEDICAL_RECORD: "MedicalRecord",
  INVOICE: "Invoice",
  COMPANY: "Company",
  SUBSCRIPTION: "Subscription",
  MESSAGE: "Message",
} as const;

/** Ações registradas na timeline. */
export const TIMELINE_ACTIONS = {
  LOGIN: "LOGIN",
  CREATED: "CREATED",
  UPDATED: "UPDATED",
  APPOINTMENT_COMPLETED: "APPOINTMENT_COMPLETED",
  PROCEDURE_REGISTERED: "PROCEDURE_REGISTERED",
  MEDICAL_RECORD_CREATED: "MEDICAL_RECORD_CREATED",
  INVOICE_ISSUED: "INVOICE_ISSUED",
  INVOICE_PAID: "INVOICE_PAID",
  CHARGE_SENT: "CHARGE_SENT",
  CONTRACT_CHANGED: "CONTRACT_CHANGED",
  SUBSCRIPTION_CHARGES_GENERATED: "SUBSCRIPTION_CHARGES_GENERATED",
  MESSAGE_QUEUED: "MESSAGE_QUEUED",
  MESSAGE_SENT: "MESSAGE_SENT",
  MESSAGE_FAILED: "MESSAGE_FAILED",
} as const;

export type TimelineEntityType =
  (typeof TIMELINE_ENTITY_TYPES)[keyof typeof TIMELINE_ENTITY_TYPES];
export type TimelineAction = (typeof TIMELINE_ACTIONS)[keyof typeof TIMELINE_ACTIONS];

export type RecordTimelineInput = {
  tenantId: string;
  entityType: TimelineEntityType | string;
  entityId: string;
  action: TimelineAction | string;
  description: string;
  createdBy?: string | null;
};

type DbClient = Prisma.TransactionClient | typeof prisma;

const dateTime = (value: Date) =>
  value.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Registra um evento na timeline universal.
 * Falhas são logadas sem interromper o fluxo principal da operação.
 */
export async function recordTimelineEvent(
  input: RecordTimelineInput,
  client: DbClient = prisma,
) {
  try {
    return await client.timelineEvent.create({
      data: {
        tenantId: input.tenantId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        description: input.description,
        createdBy: input.createdBy ?? null,
      },
    });
  } catch (error) {
    console.error("[timeline] falha ao registrar evento:", error);
    return null;
  }
}

export type TimelineEventView = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  description: string;
  createdAt: string;
  createdAtLabel: string;
  createdBy: string | null;
  actorName: string | null;
};

/** Busca eventos relacionados a um beneficiário (Cliente 360°). */
export async function getPatientTimelineEvents(
  patientId: string,
  tenantId: string,
  relatedIds: {
    appointmentIds: string[];
    usageIds: string[];
    recordIds: string[];
    invoiceIds: string[];
    subscriptionIds: string[];
    messageIds: string[];
  },
): Promise<TimelineEventView[]> {
  const orFilters: Prisma.TimelineEventWhereInput[] = [
    { entityType: TIMELINE_ENTITY_TYPES.PATIENT, entityId: patientId },
  ];

  if (relatedIds.appointmentIds.length > 0) {
    orFilters.push({
      entityType: TIMELINE_ENTITY_TYPES.APPOINTMENT,
      entityId: { in: relatedIds.appointmentIds },
    });
  }
  if (relatedIds.usageIds.length > 0) {
    orFilters.push({
      entityType: TIMELINE_ENTITY_TYPES.PROCEDURE_USAGE,
      entityId: { in: relatedIds.usageIds },
    });
  }
  if (relatedIds.recordIds.length > 0) {
    orFilters.push({
      entityType: TIMELINE_ENTITY_TYPES.MEDICAL_RECORD,
      entityId: { in: relatedIds.recordIds },
    });
  }
  if (relatedIds.invoiceIds.length > 0) {
    orFilters.push({
      entityType: TIMELINE_ENTITY_TYPES.INVOICE,
      entityId: { in: relatedIds.invoiceIds },
    });
  }
  if (relatedIds.subscriptionIds.length > 0) {
    orFilters.push({
      entityType: TIMELINE_ENTITY_TYPES.SUBSCRIPTION,
      entityId: { in: relatedIds.subscriptionIds },
    });
  }
  if (relatedIds.messageIds.length > 0) {
    orFilters.push({
      entityType: TIMELINE_ENTITY_TYPES.MESSAGE,
      entityId: { in: relatedIds.messageIds },
    });
  }

  const events = await prisma.timelineEvent.findMany({
    where: { tenantId, OR: orFilters },
    orderBy: { createdAt: "desc" },
  });

  const actorIds = [...new Set(events.map((event) => event.createdBy).filter(Boolean))] as string[];
  const actors =
    actorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, name: true },
        })
      : [];
  const actorMap = new Map(actors.map((actor) => [actor.id, actor.name]));

  return events.map((event) => ({
    id: event.id,
    entityType: event.entityType,
    entityId: event.entityId,
    action: event.action,
    description: event.description,
    createdAt: event.createdAt.toISOString(),
    createdAtLabel: dateTime(event.createdAt),
    createdBy: event.createdBy,
    actorName: event.createdBy ? (actorMap.get(event.createdBy) ?? null) : null,
  }));
}
