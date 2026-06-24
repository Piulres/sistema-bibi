import "server-only";
import { getPrisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import { snapshotProcedure } from "@/lib/change-management/snapshots";
import { runChangeCommand } from "@/lib/change-management/run-change";
import { recordTimelineEvent, TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline";

export const PROCEDURE_CATEGORIES = ["CONSULTA", "EXAME"] as const;

export function isProcedureCategory(value: string): boolean {
  return (PROCEDURE_CATEGORIES as readonly string[]).includes(value);
}

export type ProcedureView = {
  id: string;
  code: string;
  name: string;
  category: string;
  basePrice: number;
  basePriceLabel: string;
};

function mapProcedure(p: {
  id: string;
  code: string;
  name: string;
  category: string;
  basePrice: number;
}): ProcedureView {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    category: p.category,
    basePrice: p.basePrice,
    basePriceLabel: formatBRL(p.basePrice),
  };
}

export async function listProcedures(tenantId: string): Promise<ProcedureView[]> {
  const prisma = await getPrisma();
  const rows = await prisma.procedure.findMany({
    where: { tenantId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return rows.map(mapProcedure);
}

export async function createProcedure(input: {
  tenantId: string;
  code: string;
  name: string;
  category: string;
  basePrice: number;
  createdBy: string;
}) {
  const prisma = await getPrisma();
  const existing = await prisma.procedure.findFirst({
    where: { tenantId: input.tenantId, code: input.code.trim() },
  });
  if (existing) return { error: "Código já cadastrado neste tenant" as const };

  const procedure = await prisma.procedure.create({
    data: {
      tenantId: input.tenantId,
      code: input.code.trim(),
      name: input.name.trim(),
      category: input.category,
      basePrice: input.basePrice,
    },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.PROCEDURE,
    entityId: procedure.id,
    action: TIMELINE_ACTIONS.CREATED,
    description: `Procedimento ${procedure.code} — ${procedure.name} cadastrado (${formatBRL(procedure.basePrice)})`,
    createdBy: input.createdBy,
  });

  return { procedure: mapProcedure(procedure) };
}

export async function updateProcedure(input: {
  tenantId: string;
  procedureId: string;
  code?: string;
  name?: string;
  category?: string;
  basePrice?: number;
  createdBy: string;
}) {
  const prisma = await getPrisma();
  const existing = await prisma.procedure.findFirst({
    where: { id: input.procedureId, tenantId: input.tenantId },
  });
  if (!existing) return null;

  if (input.code && input.code.trim() !== existing.code) {
    const dup = await prisma.procedure.findFirst({
      where: { tenantId: input.tenantId, code: input.code.trim(), NOT: { id: existing.id } },
    });
    if (dup) return { error: "Código já cadastrado" as const };
  }

  const beforeSnapshot = snapshotProcedure(existing);
  const priceChanged =
    input.basePrice !== undefined && input.basePrice !== existing.basePrice;

  const procedure = await runChangeCommand({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.PROCEDURE,
    entityId: existing.id,
    action: TIMELINE_ACTIONS.UPDATED,
    description: priceChanged
      ? `Procedimento ${existing.code}: preço ${formatBRL(existing.basePrice)} → ${formatBRL(input.basePrice!)} (usos já registrados mantêm valor congelado)`
      : `Procedimento ${existing.code} atualizado`,
    createdBy: input.createdBy,
    before: beforeSnapshot,
    reversible: true,
    afterSnapshot: snapshotProcedure,
    execute: async (tx) =>
      tx.procedure.update({
        where: { id: existing.id },
        data: {
          code: input.code?.trim() ?? undefined,
          name: input.name?.trim() ?? undefined,
          category: input.category ?? undefined,
          basePrice: input.basePrice ?? undefined,
        },
      }),
  });

  return { procedure: mapProcedure(procedure) };
}

export async function deleteProcedure(input: {
  tenantId: string;
  procedureId: string;
  createdBy: string;
}) {
  const prisma = await getPrisma();
  const existing = await prisma.procedure.findFirst({
    where: { id: input.procedureId, tenantId: input.tenantId },
    include: { usages: { take: 1 } },
  });
  if (!existing) return null;
  if (existing.usages.length > 0) {
    return { error: "Procedimento com uso registrado não pode ser excluído" as const };
  }

  const beforeSnapshot = snapshotProcedure(existing);

  await runChangeCommand({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.PROCEDURE,
    entityId: existing.id,
    action: TIMELINE_ACTIONS.DELETED,
    description: `Procedimento ${existing.code} removido do catálogo`,
    createdBy: input.createdBy,
    deleteSnapshot: beforeSnapshot,
    reversible: true,
    execute: async (tx) => {
      await tx.procedure.delete({ where: { id: existing.id } });
      return { id: existing.id };
    },
  });

  return { ok: true as const };
}
