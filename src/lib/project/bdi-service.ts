import "server-only";
import { getPrisma } from "@/lib/db";
import { sumBdiPercent, applyBdi, type BdiBreakdownInput } from "@/lib/project/construction-modules";

export type BdiBreakdownView = BdiBreakdownInput & {
  totalPercent: number;
};

export async function getBdiBreakdown(
  tenantId: string,
  budgetId: string,
): Promise<BdiBreakdownView | null> {
  const prisma = await getPrisma();
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, project: { tenantId } },
    include: { bdiBreakdown: true },
  });
  if (!budget) return null;

  if (budget.bdiBreakdown) {
    const bdi = budget.bdiBreakdown;
    return {
      administration: bdi.administration,
      risk: bdi.risk,
      profit: bdi.profit,
      taxes: bdi.taxes,
      financial: bdi.financial,
      totalPercent: sumBdiPercent(bdi),
    };
  }

  return {
    administration: 0,
    risk: 0,
    profit: budget.bdiPercent,
    taxes: 0,
    financial: 0,
    totalPercent: budget.bdiPercent,
  };
}

export async function upsertBdiBreakdown(
  tenantId: string,
  budgetId: string,
  input: BdiBreakdownInput,
): Promise<{ data: BdiBreakdownView; budgetTotal: number } | { error: string }> {
  const prisma = await getPrisma();
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, project: { tenantId } },
    include: { lineItems: true },
  });
  if (!budget) return { error: "Orçamento não encontrado" };
  if (budget.status === "APROVADO") return { error: "Orçamento aprovado não pode ser editado" };

  const totalPercent = sumBdiPercent(input);
  const subtotal = budget.lineItems.reduce((s, li) => s + li.total, 0);
  const total = applyBdi(subtotal, totalPercent);

  await prisma.budgetBdiBreakdown.upsert({
    where: { budgetId },
    create: { budgetId, ...input },
    update: { ...input },
  });

  await prisma.budget.update({
    where: { id: budgetId },
    data: { bdiPercent: totalPercent, subtotal, total },
  });

  return {
    data: { ...input, totalPercent },
    budgetTotal: total,
  };
}
