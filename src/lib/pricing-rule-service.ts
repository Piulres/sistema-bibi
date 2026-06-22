import "server-only";
import { getPrisma } from "@/lib/db";
import { computePrice, formatBRL } from "@/lib/pricing";
import {
  recordTimelineEvent,
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "@/lib/timeline";

export type PricingRuleView = {
  id: string;
  description: string;
  multiplier: number;
  multiplierLabel: string;
  procedureId: string;
  procedureCode: string;
  procedureName: string;
  basePrice: number;
  basePriceLabel: string;
  effectivePriceLabel: string;
  companyId: string | null;
  companyName: string | null;
};

function multiplierLabel(multiplier: number): string {
  if (multiplier === 1) return "Preço cheio (100%)";
  const pct = Math.round((1 - multiplier) * 100);
  return pct > 0 ? `${pct}% de desconto (${multiplier}×)` : `${Math.round((multiplier - 1) * 100)}% de acréscimo (${multiplier}×)`;
}

async function mapRule(row: {
  id: string;
  description: string;
  multiplier: number;
  procedureId: string;
  companyId: string | null;
  procedure: { code: string; name: string; basePrice: number };
  company: { name: string } | null;
}): Promise<PricingRuleView> {
  const effective = Math.round(row.procedure.basePrice * row.multiplier * 100) / 100;
  return {
    id: row.id,
    description: row.description,
    multiplier: row.multiplier,
    multiplierLabel: multiplierLabel(row.multiplier),
    procedureId: row.procedureId,
    procedureCode: row.procedure.code,
    procedureName: row.procedure.name,
    basePrice: row.procedure.basePrice,
    basePriceLabel: formatBRL(row.procedure.basePrice),
    effectivePriceLabel: formatBRL(effective),
    companyId: row.companyId,
    companyName: row.company?.name ?? null,
  };
}

const ruleInclude = {
  procedure: { select: { code: true, name: true, basePrice: true, tenantId: true } },
  company: { select: { name: true, tenantId: true } },
} as const;

export async function listPricingRules(tenantId: string): Promise<PricingRuleView[]> {
  const prisma = await getPrisma();
  const rows = await prisma.pricingRule.findMany({
    where: { procedure: { tenantId } },
    include: ruleInclude,
    orderBy: [{ company: { name: "asc" } }, { procedure: { name: "asc" } }],
  });
  return Promise.all(rows.map(mapRule));
}

export async function createPricingRule(input: {
  tenantId: string;
  procedureId: string;
  companyId: string;
  multiplier: number;
  description?: string;
  createdBy: string;
}) {
  const prisma = await getPrisma();
  if (input.multiplier <= 0) {
    return { error: "Multiplicador deve ser maior que zero" as const };
  }

  const procedure = await prisma.procedure.findFirst({
    where: { id: input.procedureId, tenantId: input.tenantId },
  });
  if (!procedure) return { error: "Procedimento não encontrado" as const };

  const company = await prisma.company.findFirst({
    where: { id: input.companyId, tenantId: input.tenantId },
  });
  if (!company) return { error: "Empresa não encontrada" as const };

  const duplicate = await prisma.pricingRule.findFirst({
    where: { procedureId: input.procedureId, companyId: input.companyId },
  });
  if (duplicate) {
    return { error: "Já existe regra para este procedimento e empresa" as const };
  }

  const { price } = await computePrice(input.procedureId, input.companyId, input.tenantId);
  const description =
    input.description?.trim() ||
    `${company.name}: ${procedure.name} — ${multiplierLabel(input.multiplier)} → ${formatBRL(price)}`;

  const rule = await prisma.pricingRule.create({
    data: {
      procedureId: input.procedureId,
      companyId: input.companyId,
      multiplier: input.multiplier,
      description,
    },
    include: ruleInclude,
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.PRICING_RULE,
    entityId: rule.id,
    action: TIMELINE_ACTIONS.CREATED,
    description: `Regra de precificação: ${company.name} · ${procedure.code} (${formatBRL(procedure.basePrice)} × ${input.multiplier} = ${formatBRL(price)})`,
    createdBy: input.createdBy,
  });

  return { rule: await mapRule(rule) };
}

export async function updatePricingRule(input: {
  tenantId: string;
  ruleId: string;
  multiplier?: number;
  description?: string;
  createdBy: string;
}) {
  const prisma = await getPrisma();
  const existing = await prisma.pricingRule.findFirst({
    where: { id: input.ruleId, procedure: { tenantId: input.tenantId } },
    include: ruleInclude,
  });
  if (!existing) return null;

  if (input.multiplier !== undefined && input.multiplier <= 0) {
    return { error: "Multiplicador deve ser maior que zero" as const };
  }

  const rule = await prisma.pricingRule.update({
    where: { id: existing.id },
    data: {
      multiplier: input.multiplier ?? undefined,
      description: input.description?.trim() ?? undefined,
    },
    include: ruleInclude,
  });

  const { price } = await computePrice(
    rule.procedureId,
    rule.companyId,
    input.tenantId,
  );

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.PRICING_RULE,
    entityId: rule.id,
    action: TIMELINE_ACTIONS.UPDATED,
    description: `Regra atualizada: ${rule.company?.name ?? "—"} · ${rule.procedure.code} — ${multiplierLabel(rule.multiplier)} → ${formatBRL(price)}`,
    createdBy: input.createdBy,
  });

  return { rule: await mapRule(rule) };
}

export async function deletePricingRule(input: {
  tenantId: string;
  ruleId: string;
  createdBy: string;
}) {
  const prisma = await getPrisma();
  const existing = await prisma.pricingRule.findFirst({
    where: { id: input.ruleId, procedure: { tenantId: input.tenantId } },
    include: ruleInclude,
  });
  if (!existing) return null;

  await prisma.pricingRule.delete({ where: { id: existing.id } });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.PRICING_RULE,
    entityId: existing.id,
    action: TIMELINE_ACTIONS.DELETED,
    description: `Regra removida: ${existing.company?.name ?? "—"} · ${existing.procedure.code}`,
    createdBy: input.createdBy,
  });

  return { ok: true as const };
}
