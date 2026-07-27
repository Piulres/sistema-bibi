/**
 * RBAC de conteúdo para auditoria / atividade recente.
 *
 * O módulo `auditoria` continua sendo o gate de rota; esta camada decide
 * quais classes de evento e quais campos sensíveis cada perfil interno pode ver.
 */

import type { InternoProfile } from "@/lib/interno-permissions";
import { isInternoProfile } from "@/lib/interno-permissions";
import {
  TIMELINE_ENTITY_LABELS,
  TIMELINE_ENTITY_TYPES,
} from "@/lib/timeline-constants";
import type { TimelineEventMetadata } from "@/lib/change-management/types";
import { metadataHasDiff } from "@/lib/change-management/metadata";

/** Classes de sensibilidade dos eventos de timeline. */
export type AuditSensitivityClass =
  | "clinical"
  | "financial"
  | "pii"
  | "security"
  | "operational";

/**
 * Nível de detalhe exposto ao perfil:
 * - full: descrição + metadata completa + diffs
 * - redacted: evento visível; valores sensíveis mascarados nos diffs
 * - summary: descrição sanitizada; sem metadata/diffs
 * - hidden: evento omitido do feed
 */
export type AuditDetailLevel = "full" | "redacted" | "summary" | "hidden";

export type AuditViewerCapabilities = {
  profile: InternoProfile;
  canRestore: boolean;
  canExport: boolean;
  canViewFullDiff: boolean;
};

const REDACTED_VALUE = "••••";

/** Campos de metadata/snapshot que nunca devem vazar fora de nível `full`. */
export const AUDIT_SENSITIVE_FIELDS = [
  "cpf",
  "cnpj",
  "phone",
  "email",
  "motherName",
  "birthDate",
  "contactEmail",
  "contactPhone",
  "contactName",
  "addressStreet",
  "addressZip",
  "employeeId",
] as const;

/** Campos financeiros mascarados em nível `summary` / `redacted` sem direito financeiro pleno. */
export const AUDIT_FINANCIAL_FIELDS = ["multiplier", "basePrice", "amount", "priceCharged"] as const;

const SENSITIVE_FIELD_SET = new Set<string>(AUDIT_SENSITIVE_FIELDS);
const FINANCIAL_FIELD_SET = new Set<string>(AUDIT_FINANCIAL_FIELDS);

const ENTITY_SENSITIVITY: Record<string, AuditSensitivityClass> = {
  [TIMELINE_ENTITY_TYPES.MEDICAL_RECORD]: "clinical",
  [TIMELINE_ENTITY_TYPES.MEDICATION_PRESCRIPTION]: "clinical",
  [TIMELINE_ENTITY_TYPES.EXAM_ORDER]: "clinical",
  [TIMELINE_ENTITY_TYPES.CARE_PROTOCOL]: "clinical",
  [TIMELINE_ENTITY_TYPES.INVOICE]: "financial",
  [TIMELINE_ENTITY_TYPES.PROCEDURE_USAGE]: "financial",
  [TIMELINE_ENTITY_TYPES.PRICING_RULE]: "financial",
  [TIMELINE_ENTITY_TYPES.SUBSCRIPTION]: "financial",
  [TIMELINE_ENTITY_TYPES.BUDGET]: "financial",
  [TIMELINE_ENTITY_TYPES.PROCEDURE]: "financial",
  [TIMELINE_ENTITY_TYPES.PATIENT]: "pii",
  [TIMELINE_ENTITY_TYPES.COMPANY]: "pii",
  [TIMELINE_ENTITY_TYPES.USER]: "security",
  [TIMELINE_ENTITY_TYPES.SECURITY]: "security",
  [TIMELINE_ENTITY_TYPES.APPOINTMENT]: "operational",
  [TIMELINE_ENTITY_TYPES.MESSAGE]: "operational",
  [TIMELINE_ENTITY_TYPES.WEBHOOK]: "operational",
  [TIMELINE_ENTITY_TYPES.BRANDING]: "operational",
  [TIMELINE_ENTITY_TYPES.MEDICAL_PRODUCT]: "operational",
  [TIMELINE_ENTITY_TYPES.STOCK_LOT]: "operational",
  [TIMELINE_ENTITY_TYPES.STOCK_MOVEMENT]: "operational",
  [TIMELINE_ENTITY_TYPES.PROJECT]: "operational",
  [TIMELINE_ENTITY_TYPES.ATTACHMENT]: "operational",
};

/** Matriz perfil × classe → nível de detalhe. */
const PROFILE_DETAIL: Record<
  InternoProfile,
  Record<AuditSensitivityClass, AuditDetailLevel>
> = {
  ADMIN: {
    clinical: "full",
    financial: "full",
    pii: "full",
    security: "full",
    operational: "full",
  },
  FATURAMENTO: {
    clinical: "summary",
    financial: "full",
    pii: "redacted",
    security: "summary",
    operational: "full",
  },
  READONLY: {
    clinical: "summary",
    financial: "summary",
    pii: "redacted",
    security: "summary",
    operational: "summary",
  },
  RECEPCAO: {
    clinical: "hidden",
    financial: "summary",
    pii: "summary",
    security: "hidden",
    operational: "summary",
  },
};

export function resolveAuditProfile(
  internoProfile: string | null | undefined,
): InternoProfile {
  if (internoProfile && isInternoProfile(internoProfile)) return internoProfile;
  return "READONLY";
}

export function auditSensitivityClass(entityType: string): AuditSensitivityClass {
  return ENTITY_SENSITIVITY[entityType] ?? "operational";
}

export function auditDetailLevelForEntity(
  profile: InternoProfile,
  entityType: string,
): AuditDetailLevel {
  return PROFILE_DETAIL[profile][auditSensitivityClass(entityType)];
}

export function resolveAuditViewerCapabilities(
  role: string,
  internoProfile: string | null | undefined,
): AuditViewerCapabilities {
  const profile = resolveAuditProfile(internoProfile);
  const isAdmin = role === "INTERNO" && profile === "ADMIN";
  return {
    profile,
    canRestore: isAdmin,
    canExport: role === "INTERNO" && profile !== "RECEPCAO",
    canViewFullDiff: profile === "ADMIN" || profile === "FATURAMENTO",
  };
}

/** Entity types visíveis (não `hidden`) para o perfil — usado em filtros SQL e UI. */
export function allowedAuditEntityTypes(profile: InternoProfile): string[] {
  return Object.values(TIMELINE_ENTITY_TYPES).filter(
    (entityType) => auditDetailLevelForEntity(profile, entityType) !== "hidden",
  );
}

export function isAuditEntityAllowed(
  profile: InternoProfile,
  entityType: string,
): boolean {
  return auditDetailLevelForEntity(profile, entityType) !== "hidden";
}

function maskCurrencyAndDocuments(text: string): string {
  return text
    .replace(/R\$\s*[\d.]+,\d{2}/g, "R$ •••")
    .replace(/\d{3}\.\d{3}\.\d{3}-\d{2}/g, "***.***.***-**")
    .replace(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g, "**.***.***/****-**");
}

function clinicalSummaryDescription(entityType: string, action: string): string {
  const label = TIMELINE_ENTITY_LABELS[entityType] ?? "Clínico";
  return `${label} — atividade clínica registrada (${action}; detalhe restrito ao perfil)`;
}

export function sanitizeAuditDescription(
  description: string,
  entityType: string,
  action: string,
  level: AuditDetailLevel,
): string {
  if (level === "full") return description;
  const sensitivity = auditSensitivityClass(entityType);
  if (sensitivity === "clinical" && (level === "summary" || level === "redacted")) {
    return clinicalSummaryDescription(entityType, action);
  }
  if (level === "summary" || level === "redacted") {
    return maskCurrencyAndDocuments(description);
  }
  return description;
}

function redactRecordValues(
  record: Record<string, unknown> | undefined,
  fieldsToMask: Set<string>,
): Record<string, unknown> | undefined {
  if (!record) return record;
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    next[key] = fieldsToMask.has(key) ? REDACTED_VALUE : value;
  }
  return next;
}

export function redactMetadataForLevel(
  metadata: TimelineEventMetadata | null,
  level: AuditDetailLevel,
  options?: { maskFinancial?: boolean },
): TimelineEventMetadata | null {
  if (!metadata) return null;
  if (level === "full") return metadata;
  if (level === "summary" || level === "hidden") return null;

  const fieldsToMask = new Set<string>(SENSITIVE_FIELD_SET);
  if (options?.maskFinancial) {
    for (const field of FINANCIAL_FIELD_SET) fieldsToMask.add(field);
  }

  return {
    ...metadata,
    before: redactRecordValues(metadata.before, fieldsToMask),
    after: redactRecordValues(metadata.after, fieldsToMask),
  };
}

export function redactSnapshotForLevel(
  snapshot: Record<string, unknown>,
  level: AuditDetailLevel,
  options?: { maskFinancial?: boolean },
): Record<string, unknown> {
  if (level === "full") return snapshot;
  if (level === "summary" || level === "hidden") {
    return { _redacted: true, fields: Object.keys(snapshot) };
  }
  const fieldsToMask = new Set<string>(SENSITIVE_FIELD_SET);
  if (options?.maskFinancial) {
    for (const field of FINANCIAL_FIELD_SET) fieldsToMask.add(field);
  }
  return redactRecordValues(snapshot, fieldsToMask) ?? {};
}

export type AuditableTimelineEvent = {
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

/**
 * Aplica política RBAC a um evento. Retorna `null` quando o perfil não pode vê-lo.
 */
export function redactTimelineEventForProfile<T extends AuditableTimelineEvent>(
  event: T,
  internoProfile: string | null | undefined,
): T | null {
  const profile = resolveAuditProfile(internoProfile);
  const level = auditDetailLevelForEntity(profile, event.entityType);
  if (level === "hidden") return null;

  const sensitivity = auditSensitivityClass(event.entityType);
  const maskFinancial = sensitivity === "financial" && level !== "full";
  const metadata = redactMetadataForLevel(event.metadata, level, { maskFinancial });
  const description = sanitizeAuditDescription(
    event.description,
    event.entityType,
    event.action,
    level,
  );

  return {
    ...event,
    description,
    metadata,
    hasDiff: metadataHasDiff(metadata),
    // Restore só faz sentido com diff completo; UI também checa capabilities.canRestore
    reversible: level === "full" ? event.reversible : false,
  };
}

export function redactTimelineEventsForProfile<T extends AuditableTimelineEvent>(
  events: T[],
  internoProfile: string | null | undefined,
): T[] {
  return events
    .map((event) => redactTimelineEventForProfile(event, internoProfile))
    .filter((event): event is T => event !== null);
}
