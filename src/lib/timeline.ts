import { getPrisma } from "@/lib/db";
import type { Prisma, PrismaClient } from "@prisma/client";
import {
  TIMELINE_ENTITY_TYPES,
  type TimelineAction,
  type TimelineEntityType,
} from "@/lib/timeline-constants";

export { TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES, TIMELINE_ENTITY_LABELS } from "@/lib/timeline-constants";
export type { TimelineAction, TimelineEntityType } from "@/lib/timeline-constants";

export type RecordTimelineInput = {
  tenantId: string;
  entityType: TimelineEntityType | string;
  entityId: string;
  action: TimelineAction | string;
  description: string;
  createdBy?: string | null;
};

type DbClient = Prisma.TransactionClient | PrismaClient;

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
  client?: DbClient,
) {
  try {
    const db = client ?? (await getPrisma());
    return await db.timelineEvent.create({
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
  const prisma = await getPrisma();
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

export type TenantAuditFilters = {
  entityType?: string;
  action?: string;
  search?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
};

export type TenantAuditResult = {
  events: TimelineEventView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/** Auditoria tenant-wide com filtros e paginação. */
export async function getTenantAuditEvents(
  tenantId: string,
  filters: TenantAuditFilters = {},
): Promise<TenantAuditResult> {
  const prisma = await getPrisma();
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 50));
  const skip = (page - 1) * limit;

  const where: {
    tenantId: string;
    entityType?: string;
    action?: string;
    description?: { contains: string };
    createdAt?: { gte?: Date; lte?: Date };
  } = { tenantId };

  if (filters.entityType?.trim()) {
    where.entityType = filters.entityType.trim();
  }
  if (filters.action?.trim()) {
    where.action = filters.action.trim();
  }
  if (filters.search?.trim()) {
    where.description = { contains: filters.search.trim() };
  }
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = filters.from;
    if (filters.to) where.createdAt.lte = filters.to;
  }

  const [events, total] = await Promise.all([
    prisma.timelineEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.timelineEvent.count({ where }),
  ]);

  const actorIds = [...new Set(events.map((event) => event.createdBy).filter(Boolean))] as string[];
  const actors =
    actorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, name: true },
        })
      : [];
  const actorMap = new Map(actors.map((actor) => [actor.id, actor.name]));

  return {
    events: events.map((event) => ({
      id: event.id,
      entityType: event.entityType,
      entityId: event.entityId,
      action: event.action,
      description: event.description,
      createdAt: event.createdAt.toISOString(),
      createdAtLabel: dateTime(event.createdAt),
      createdBy: event.createdBy,
      actorName: event.createdBy ? (actorMap.get(event.createdBy) ?? null) : null,
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
