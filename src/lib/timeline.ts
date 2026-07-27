import { formatDateTimeBR as dateTime } from "@/lib/timezone";
import { getPrisma } from "@/lib/db";
import type { Prisma, PrismaClient } from "@prisma/client";
import {
  metadataHasDiff,
  parseTimelineMetadata,
  serializeTimelineMetadata,
  type TimelineEventMetadata,
} from "@/lib/change-management";
import {
  TIMELINE_ENTITY_TYPES,
  type TimelineAction,
  type TimelineEntityType,
} from "@/lib/timeline-constants";
import {
  allowedAuditEntityTypes,
  auditDetailLevelForEntity,
  isAuditEntityAllowed,
  redactTimelineEventsForProfile,
  resolveAuditProfile,
  resolveAuditViewerCapabilities,
  searchableAuditEntityTypes,
  type AuditViewerCapabilities,
} from "@/lib/audit-access";

export { TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES, TIMELINE_ENTITY_LABELS } from "@/lib/timeline-constants";
export type { TimelineAction, TimelineEntityType } from "@/lib/timeline-constants";
export type { TimelineEventMetadata } from "@/lib/change-management";
export type { AuditViewerCapabilities } from "@/lib/audit-access";

export type RecordTimelineInput = {
  tenantId: string;
  entityType: TimelineEntityType | string;
  entityId: string;
  action: TimelineAction | string;
  description: string;
  createdBy?: string | null;
  metadata?: TimelineEventMetadata;
  correlationId?: string | null;
  reversesId?: string | null;
  reversible?: boolean;
};

type DbClient = Prisma.TransactionClient | PrismaClient;


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
        metadata: input.metadata ? serializeTimelineMetadata(input.metadata) : null,
        correlationId: input.correlationId ?? null,
        reversesId: input.reversesId ?? null,
        reversible: input.reversible ?? false,
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
  metadata: TimelineEventMetadata | null;
  hasDiff: boolean;
  correlationId: string | null;
  reversesId: string | null;
  reversible: boolean;
};

function mapTimelineEventView(
  event: {
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    description: string;
    createdAt: Date;
    createdBy: string | null;
    metadata: string | null;
    correlationId: string | null;
    reversesId: string | null;
    reversible: boolean;
  },
  actorMap: Map<string, string>,
): TimelineEventView {
  const metadata = parseTimelineMetadata(event.metadata);
  return {
    id: event.id,
    entityType: event.entityType,
    entityId: event.entityId,
    action: event.action,
    description: event.description,
    createdAt: event.createdAt.toISOString(),
    createdAtLabel: dateTime(event.createdAt),
    createdBy: event.createdBy,
    actorName: event.createdBy ? (actorMap.get(event.createdBy) ?? null) : null,
    metadata,
    hasDiff: metadataHasDiff(metadata),
    correlationId: event.correlationId,
    reversesId: event.reversesId,
    reversible: event.reversible,
  };
}

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
  options?: { internoProfile?: string | null },
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

  const mapped = events.map((event) => mapTimelineEventView(event, actorMap));
  // Sem contexto de perfil (prestador/beneficiário) mantém a timeline completa do vínculo.
  if (!options || !("internoProfile" in options)) {
    return mapped;
  }
  return redactTimelineEventsForProfile(mapped, options.internoProfile);
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

export type TenantAuditAccess = {
  role?: string;
  internoProfile?: string | null;
};

export type TenantAuditResult = {
  events: TimelineEventView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  capabilities: AuditViewerCapabilities;
  allowedEntityTypes: string[];
};

/** Auditoria tenant-wide com filtros, paginação e redação RBAC. */
export async function getTenantAuditEvents(
  tenantId: string,
  filters: TenantAuditFilters = {},
  access: TenantAuditAccess = {},
): Promise<TenantAuditResult> {
  const prisma = await getPrisma();
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 50));
  const skip = (page - 1) * limit;
  const profile = resolveAuditProfile(access.internoProfile);
  const capabilities = resolveAuditViewerCapabilities(
    access.role ?? "INTERNO",
    access.internoProfile,
  );
  const allowedEntityTypes = allowedAuditEntityTypes(profile);

  const emptyResult = (): TenantAuditResult => ({
    events: [],
    total: 0,
    page,
    limit,
    totalPages: 1,
    capabilities,
    allowedEntityTypes,
  });

  const where: Prisma.TimelineEventWhereInput = {
    tenantId,
    entityType: { in: allowedEntityTypes },
  };

  const requestedType = filters.entityType?.trim();
  if (requestedType) {
    if (!isAuditEntityAllowed(profile, requestedType)) {
      return emptyResult();
    }
    where.entityType = requestedType;
  }
  if (filters.action?.trim()) {
    where.action = filters.action.trim();
  }
  const search = filters.search?.trim();
  if (search) {
    // Só busca descrição em tipos com nível `full` — evita oráculo de existência
    // (hit count) sobre conteúdo clínico/PII que depois seria redigido.
    const searchableTypes = searchableAuditEntityTypes(profile);
    if (requestedType) {
      if (auditDetailLevelForEntity(profile, requestedType) !== "full") {
        return emptyResult();
      }
    } else if (searchableTypes.length === 0) {
      return emptyResult();
    } else {
      where.entityType = { in: searchableTypes };
    }
    where.description = { contains: search };
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

  const mapped = events.map((event) => mapTimelineEventView(event, actorMap));
  const redacted = redactTimelineEventsForProfile(mapped, access.internoProfile);

  return {
    events: redacted,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    capabilities,
    allowedEntityTypes,
  };
}
