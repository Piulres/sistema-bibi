import "server-only";
import { getPrisma } from "@/lib/db";
import { parseTimelineMetadata } from "@/lib/change-management/metadata";
import {
  getRestoreWindowMs,
  isRestorableEntity,
  RESTORE_CONFIRM_PHRASE,
  restoreRequiresConfirmPhrase,
} from "@/lib/change-management/policy";
import { snapshotBranding, snapshotCompany, snapshotPatient, snapshotPricingRule, snapshotProcedure } from "@/lib/change-management/snapshots";
import { runChangeCommand } from "@/lib/change-management/run-change";
import { recordTimelineEvent, TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline";
import { dispatchWebhooks } from "@/lib/webhook-service";

export class RestoreError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "NOT_REVERSIBLE" | "NO_SNAPSHOT" | "FORBIDDEN" | "WINDOW_EXPIRED" | "CONFIRM_REQUIRED",
  ) {
    super(message);
    this.name = "RestoreError";
  }
}

async function applyPatientSnapshot(
  tenantId: string,
  entityId: string,
  before: Record<string, unknown>,
  createdBy: string,
) {
  const prisma = await getPrisma();
  const existing = await prisma.patient.findFirst({
    where: { id: entityId, tenantId },
    include: { company: { select: { name: true } } },
  });
  if (!existing) throw new RestoreError("Beneficiário não encontrado", "NOT_FOUND");

  const beforeSnap = snapshotPatient(existing);
  return runChangeCommand({
    tenantId,
    entityType: TIMELINE_ENTITY_TYPES.PATIENT,
    entityId,
    action: TIMELINE_ACTIONS.RESTORED,
    description: `Beneficiário ${String(before.name ?? existing.name)} restaurado via auditoria`,
    createdBy,
    before: beforeSnap,
    afterSnapshot: (patient) =>
      snapshotPatient(patient as Parameters<typeof snapshotPatient>[0]),
    execute: async (tx) =>
      tx.patient.update({
        where: { id: entityId },
        data: {
          name: String(before.name ?? existing.name),
          cpf: String(before.cpf ?? existing.cpf),
          birthDate: before.birthDate ? new Date(String(before.birthDate)) : existing.birthDate,
          phone: (before.phone as string | null) ?? null,
          email: (before.email as string | null) ?? null,
          gender: (before.gender as string | null) ?? null,
          motherName: (before.motherName as string | null) ?? null,
          employeeId: (before.employeeId as string | null) ?? null,
          bondType: (before.bondType as string | null) ?? null,
          companyId: (before.companyId as string | null) ?? null,
        },
        include: { company: { select: { name: true } } },
      }),
  });
}

async function applyCompanySnapshot(
  tenantId: string,
  entityId: string,
  before: Record<string, unknown>,
  createdBy: string,
) {
  const prisma = await getPrisma();
  const existing = await prisma.company.findFirst({ where: { id: entityId, tenantId } });
  if (!existing) throw new RestoreError("Empresa não encontrada", "NOT_FOUND");

  const beforeSnap = snapshotCompany(existing);
  return runChangeCommand({
    tenantId,
    entityType: TIMELINE_ENTITY_TYPES.COMPANY,
    entityId,
    action: TIMELINE_ACTIONS.RESTORED,
    description: `Empresa ${String(before.name ?? existing.name)} restaurada via auditoria`,
    createdBy,
    before: beforeSnap,
    afterSnapshot: (company) =>
      snapshotCompany(company as Parameters<typeof snapshotCompany>[0]),
    execute: async (tx) =>
      tx.company.update({
        where: { id: entityId },
        data: {
          name: String(before.name ?? existing.name),
          cnpj: String(before.cnpj ?? existing.cnpj),
          tradeName: (before.tradeName as string | null) ?? null,
          email: (before.email as string | null) ?? null,
          phone: (before.phone as string | null) ?? null,
          contactName: (before.contactName as string | null) ?? null,
          contactEmail: (before.contactEmail as string | null) ?? null,
          contactPhone: (before.contactPhone as string | null) ?? null,
          addressStreet: (before.addressStreet as string | null) ?? null,
          addressCity: (before.addressCity as string | null) ?? null,
          addressState: (before.addressState as string | null) ?? null,
          addressZip: (before.addressZip as string | null) ?? null,
          status: String(before.status ?? existing.status),
          contractActive: Boolean(before.contractActive ?? existing.contractActive),
        },
      }),
  });
}

async function applyProcedureSnapshot(
  tenantId: string,
  entityId: string,
  before: Record<string, unknown>,
  createdBy: string,
) {
  const prisma = await getPrisma();
  const existing = await prisma.procedure.findFirst({ where: { id: entityId, tenantId } });
  if (!existing) throw new RestoreError("Procedimento não encontrado", "NOT_FOUND");

  const beforeSnap = snapshotProcedure(existing);
  return runChangeCommand({
    tenantId,
    entityType: TIMELINE_ENTITY_TYPES.PROCEDURE,
    entityId,
    action: TIMELINE_ACTIONS.RESTORED,
    description: `Procedimento ${String(before.code ?? existing.code)} restaurado via auditoria`,
    createdBy,
    before: beforeSnap,
    afterSnapshot: (procedure) =>
      snapshotProcedure(procedure as Parameters<typeof snapshotProcedure>[0]),
    execute: async (tx) =>
      tx.procedure.update({
        where: { id: entityId },
        data: {
          code: String(before.code ?? existing.code),
          name: String(before.name ?? existing.name),
          category: String(before.category ?? existing.category),
          basePrice: Number(before.basePrice ?? existing.basePrice),
        },
      }),
  });
}

async function applyPricingRuleSnapshot(
  tenantId: string,
  entityId: string,
  before: Record<string, unknown>,
  createdBy: string,
) {
  const prisma = await getPrisma();
  const existing = await prisma.pricingRule.findFirst({
    where: { id: entityId, procedure: { tenantId } },
    include: { procedure: { select: { code: true, name: true } }, company: { select: { name: true } } },
  });
  if (!existing) throw new RestoreError("Regra de precificação não encontrada", "NOT_FOUND");

  const beforeSnap = snapshotPricingRule(existing);
  return runChangeCommand({
    tenantId,
    entityType: TIMELINE_ENTITY_TYPES.PRICING_RULE,
    entityId,
    action: TIMELINE_ACTIONS.RESTORED,
    description: `Regra de precificação restaurada via auditoria`,
    createdBy,
    before: beforeSnap,
    execute: async (tx) => {
      await tx.pricingRule.update({
        where: { id: entityId },
        data: {
          multiplier: Number(before.multiplier ?? existing.multiplier),
          description: String(before.description ?? existing.description),
        },
      });
      return tx.pricingRule.findFirstOrThrow({
        where: { id: entityId },
        include: {
          procedure: { select: { code: true, name: true } },
          company: { select: { name: true } },
        },
      });
    },
    afterSnapshot: (rule) => snapshotPricingRule(rule as Parameters<typeof snapshotPricingRule>[0]),
  });
}

async function applyBrandingSnapshot(
  tenantId: string,
  before: Record<string, unknown>,
  createdBy: string,
) {
  const prisma = await getPrisma();
  const existing = await prisma.tenantBranding.findUnique({ where: { tenantId } });
  if (!existing) throw new RestoreError("Branding não encontrado", "NOT_FOUND");

  const beforeSnap = snapshotBranding(existing);
  return runChangeCommand({
    tenantId,
    entityType: TIMELINE_ENTITY_TYPES.BRANDING,
    entityId: tenantId,
    action: TIMELINE_ACTIONS.RESTORED,
    description: `Identidade visual restaurada via auditoria`,
    createdBy,
    before: beforeSnap,
    afterSnapshot: (row) => snapshotBranding(row as Parameters<typeof snapshotBranding>[0]),
    execute: async (tx) =>
      tx.tenantBranding.update({
        where: { tenantId },
        data: {
          displayName: String(before.displayName ?? existing.displayName),
          tagline: (before.tagline as string | null) ?? null,
          primaryColor: String(before.primaryColor ?? existing.primaryColor),
          accentColor: String(before.accentColor ?? existing.accentColor),
          heroFrom: String(before.heroFrom ?? existing.heroFrom),
          heroTo: String(before.heroTo ?? existing.heroTo),
          platformLabel: String(before.platformLabel ?? existing.platformLabel),
          colorScheme: String(before.colorScheme ?? existing.colorScheme),
        },
      }),
  });
}

async function applySnapshotForEntity(
  tenantId: string,
  entityType: string,
  entityId: string,
  before: Record<string, unknown>,
  createdBy: string,
) {
  switch (entityType) {
    case TIMELINE_ENTITY_TYPES.PATIENT:
      return applyPatientSnapshot(tenantId, entityId, before, createdBy);
    case TIMELINE_ENTITY_TYPES.COMPANY:
      return applyCompanySnapshot(tenantId, entityId, before, createdBy);
    case TIMELINE_ENTITY_TYPES.PROCEDURE:
      return applyProcedureSnapshot(tenantId, entityId, before, createdBy);
    case TIMELINE_ENTITY_TYPES.PRICING_RULE:
      return applyPricingRuleSnapshot(tenantId, entityId, before, createdBy);
    case TIMELINE_ENTITY_TYPES.BRANDING:
      return applyBrandingSnapshot(tenantId, before, createdBy);
    default:
      throw new RestoreError(`Restore não implementado para ${entityType}`, "NOT_REVERSIBLE");
  }
}

export async function restoreFromTimelineEvent(input: {
  tenantId: string;
  eventId: string;
  createdBy: string;
  confirm?: string;
}) {
  if (restoreRequiresConfirmPhrase() && input.confirm?.trim().toUpperCase() !== RESTORE_CONFIRM_PHRASE) {
    throw new RestoreError(`Confirmação obrigatória: digite ${RESTORE_CONFIRM_PHRASE}`, "CONFIRM_REQUIRED");
  }

  const prisma = await getPrisma();
  const event = await prisma.timelineEvent.findFirst({
    where: { id: input.eventId, tenantId: input.tenantId },
  });
  if (!event) throw new RestoreError("Evento não encontrado", "NOT_FOUND");
  if (!event.reversible) throw new RestoreError("Evento não é reversível", "NOT_REVERSIBLE");
  if (!isRestorableEntity(event.entityType)) {
    throw new RestoreError("Entidade não suporta restore", "NOT_REVERSIBLE");
  }

  const metadata = parseTimelineMetadata(event.metadata);
  if (!metadata?.before) throw new RestoreError("Evento sem snapshot anterior", "NO_SNAPSHOT");

  const result = await applySnapshotForEntity(
    input.tenantId,
    event.entityType,
    event.entityId,
    metadata.before,
    input.createdBy,
  );

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: event.entityType,
    entityId: event.entityId,
    action: TIMELINE_ACTIONS.REVERTED,
    description: `Alteração revertida (evento ${event.id.slice(0, 8)}…)`,
    createdBy: input.createdBy,
    reversesId: event.id,
    reversible: false,
  });

  void dispatchWebhooks({
    tenantId: input.tenantId,
    event: "ENTITY_REVERTED",
    data: {
      originalEventId: event.id,
      entityType: event.entityType,
      entityId: event.entityId,
    },
  });

  return { ok: true as const, entityType: event.entityType, entityId: event.entityId, result };
}

export async function revertRecentChange(input: {
  tenantId: string;
  entityType: string;
  entityId: string;
  createdBy: string;
  withinMs?: number;
}) {
  const prisma = await getPrisma();
  const windowMs = input.withinMs ?? getRestoreWindowMs();
  const since = new Date(Date.now() - windowMs);

  const event = await prisma.timelineEvent.findFirst({
    where: {
      tenantId: input.tenantId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: TIMELINE_ACTIONS.UPDATED,
      createdBy: input.createdBy,
      reversible: true,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!event) throw new RestoreError("Nenhuma alteração recente para desfazer", "WINDOW_EXPIRED");

  return restoreFromTimelineEvent({
    tenantId: input.tenantId,
    eventId: event.id,
    createdBy: input.createdBy,
    confirm: RESTORE_CONFIRM_PHRASE,
  });
}
