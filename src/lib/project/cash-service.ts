import "server-only";
import { getPrisma } from "@/lib/db";
import { labelOf, CASH_CATEGORIES, CASH_ENTRY_TYPES } from "@/lib/project/construction-modules";

export type CashEntryView = {
  id: string;
  type: string;
  typeLabel: string;
  category: string;
  categoryLabel: string;
  description: string;
  amount: number;
  isPlanned: boolean;
  entryDate: string;
};

export type ProjectCashSummary = {
  plannedIncome: number;
  plannedExpense: number;
  actualIncome: number;
  actualExpense: number;
  balancePlanned: number;
  balanceActual: number;
  variance: number;
};

export async function listProjectCashEntries(
  tenantId: string,
  projectId: string,
): Promise<CashEntryView[]> {
  const prisma = await getPrisma();
  const rows = await prisma.projectCashEntry.findMany({
    where: { tenantId, projectId },
    orderBy: { entryDate: "desc" },
  });
  return rows.map(mapCashEntry);
}

export async function upsertProjectCashEntry(
  tenantId: string,
  projectId: string,
  input: {
    id?: string;
    type: string;
    category: string;
    description: string;
    amount: number;
    isPlanned: boolean;
    entryDate: string;
  },
): Promise<{ data: CashEntryView } | { error: string }> {
  const prisma = await getPrisma();
  const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
  if (!project) return { error: "Obra não encontrada" };

  const payload = {
    type: input.type,
    category: input.category,
    description: input.description,
    amount: input.amount,
    isPlanned: input.isPlanned,
    entryDate: new Date(input.entryDate),
  };

  const row = input.id
    ? await prisma.projectCashEntry.update({
        where: { id: input.id },
        data: payload,
      })
    : await prisma.projectCashEntry.create({
        data: { ...payload, tenantId, projectId },
      });

  return { data: mapCashEntry(row) };
}

export async function deleteProjectCashEntry(
  tenantId: string,
  entryId: string,
): Promise<{ ok: true } | { error: string }> {
  const prisma = await getPrisma();
  const row = await prisma.projectCashEntry.findFirst({ where: { id: entryId, tenantId } });
  if (!row) return { error: "Lançamento não encontrado" };
  await prisma.projectCashEntry.delete({ where: { id: entryId } });
  return { ok: true };
}

export async function getProjectCashSummary(
  tenantId: string,
  projectId: string,
): Promise<ProjectCashSummary> {
  const prisma = await getPrisma();
  const entries = await prisma.projectCashEntry.findMany({
    where: { tenantId, projectId },
  });

  let plannedIncome = 0;
  let plannedExpense = 0;
  let actualIncome = 0;
  let actualExpense = 0;

  for (const e of entries) {
    const bucket = e.isPlanned
      ? e.type === "ENTRADA"
        ? "plannedIncome"
        : "plannedExpense"
      : e.type === "ENTRADA"
        ? "actualIncome"
        : "actualExpense";

    if (bucket === "plannedIncome") plannedIncome += e.amount;
    else if (bucket === "plannedExpense") plannedExpense += e.amount;
    else if (bucket === "actualIncome") actualIncome += e.amount;
    else actualExpense += e.amount;
  }

  const balancePlanned = plannedIncome - plannedExpense;
  const balanceActual = actualIncome - actualExpense;

  return {
    plannedIncome,
    plannedExpense,
    actualIncome,
    actualExpense,
    balancePlanned,
    balanceActual,
    variance: balanceActual - balancePlanned,
  };
}

/** Espelha faturamento/pagamento no caixa da obra (idempotente por referência). */
export async function mirrorProjectCashEntry(input: {
  tenantId: string;
  projectId: string;
  type: "ENTRADA" | "SAIDA";
  category: string;
  description: string;
  amount: number;
  referenceType: string;
  referenceId: string;
  entryDate?: Date;
}): Promise<void> {
  const prisma = await getPrisma();
  const existing = await prisma.projectCashEntry.findFirst({
    where: {
      tenantId: input.tenantId,
      projectId: input.projectId,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
    },
  });
  if (existing) return;

  await prisma.projectCashEntry.create({
    data: {
      tenantId: input.tenantId,
      projectId: input.projectId,
      type: input.type,
      category: input.category,
      description: input.description,
      amount: input.amount,
      isPlanned: false,
      entryDate: input.entryDate ?? new Date(),
      referenceType: input.referenceType,
      referenceId: input.referenceId,
    },
  });
}

function mapCashEntry(row: {
  id: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  isPlanned: boolean;
  entryDate: Date;
}): CashEntryView {
  return {
    id: row.id,
    type: row.type,
    typeLabel: labelOf(CASH_ENTRY_TYPES, row.type),
    category: row.category,
    categoryLabel: labelOf(CASH_CATEGORIES, row.category),
    description: row.description,
    amount: row.amount,
    isPlanned: row.isPlanned,
    entryDate: row.entryDate.toISOString(),
  };
}
