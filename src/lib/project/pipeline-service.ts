import "server-only";
import { getPrisma } from "@/lib/db";
import { labelOf, PIPELINE_STATUSES } from "@/lib/project/construction-modules";
import { createProject } from "@/lib/project/project-service";

export type PipelineEntryView = {
  id: string;
  contactName: string;
  projectName: string | null;
  estimatedValue: number;
  status: string;
  statusLabel: string;
  probability: number;
  expectedClose: string | null;
  companyName: string | null;
  projectId: string | null;
  notes: string | null;
  weightedValue: number;
};

export type PipelineSummary = {
  columns: { status: string; statusLabel: string; entries: PipelineEntryView[]; totalValue: number }[];
  totalPipeline: number;
  weightedPipeline: number;
};

export type SalesGoalView = {
  id: string;
  year: number;
  month: number;
  targetRevenue: number;
  targetBdiCoverage: number;
  notes: string | null;
  actualRevenue: number;
  coveragePercent: number;
};

export async function listPipeline(
  tenantId: string,
): Promise<PipelineSummary> {
  const prisma = await getPrisma();
  const rows = await prisma.constructionPipelineEntry.findMany({
    where: { tenantId, status: { not: "PERDIDO" } },
    include: { company: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const entries = rows.map(mapPipelineEntry);
  const columns = PIPELINE_STATUSES.filter((s) => s.value !== "PERDIDO").map((s) => {
    const col = entries.filter((e) => e.status === s.value);
    return {
      status: s.value,
      statusLabel: s.label,
      entries: col,
      totalValue: col.reduce((sum, e) => sum + e.estimatedValue, 0),
    };
  });

  const totalPipeline = entries.reduce((sum, e) => sum + e.estimatedValue, 0);
  const weightedPipeline = entries.reduce((sum, e) => sum + e.weightedValue, 0);

  return { columns, totalPipeline, weightedPipeline };
}

export async function upsertPipelineEntry(
  tenantId: string,
  input: {
    id?: string;
    contactName: string;
    projectName?: string | null;
    estimatedValue: number;
    status: string;
    probability?: number;
    expectedClose?: string | null;
    companyId?: string | null;
    projectId?: string | null;
    notes?: string | null;
  },
): Promise<{ data: PipelineEntryView } | { error: string }> {
  const prisma = await getPrisma();
  const payload = {
    contactName: input.contactName,
    projectName: input.projectName ?? null,
    estimatedValue: input.estimatedValue,
    status: input.status,
    probability: input.probability ?? 0,
    expectedClose: input.expectedClose ? new Date(input.expectedClose) : null,
    companyId: input.companyId ?? null,
    projectId: input.projectId ?? null,
    notes: input.notes ?? null,
  };

  const row = input.id
    ? await prisma.constructionPipelineEntry.update({
        where: { id: input.id },
        data: payload,
        include: { company: { select: { name: true } } },
      })
    : await prisma.constructionPipelineEntry.create({
        data: { ...payload, tenantId },
        include: { company: { select: { name: true } } },
      });

  return { data: mapPipelineEntry(row) };
}

/** Converte lead ganho em obra (ORCAMENTO) e vincula ao pipeline. */
export async function convertPipelineToProject(
  tenantId: string,
  entryId: string,
  createdBy: string,
): Promise<{ data: PipelineEntryView; projectId: string; projectCode: string } | { error: string }> {
  const prisma = await getPrisma();
  const entry = await prisma.constructionPipelineEntry.findFirst({
    where: { id: entryId, tenantId },
    include: { company: { select: { name: true } } },
  });
  if (!entry) return { error: "Lead não encontrado" };
  if (entry.projectId) return { error: "Lead já convertido em obra" };

  const year = new Date().getFullYear();
  const count = await prisma.project.count({ where: { tenantId } });
  const code = `OBR-${year}-${String(count + 1).padStart(3, "0")}`;

  const created = await createProject({
    tenantId,
    code,
    name: entry.projectName?.trim() || `Obra — ${entry.contactName}`,
    status: "ORCAMENTO",
    companyId: entry.companyId,
    notes: entry.notes,
    createdBy,
  });
  if ("error" in created) return { error: created.error };

  const row = await prisma.constructionPipelineEntry.update({
    where: { id: entryId },
    data: { projectId: created.project.id, status: "GANHO", probability: 100 },
    include: { company: { select: { name: true } } },
  });

  return {
    data: mapPipelineEntry(row),
    projectId: created.project.id,
    projectCode: created.project.code,
  };
}

export async function listSalesGoals(tenantId: string, year: number): Promise<SalesGoalView[]> {
  const prisma = await getPrisma();
  const goals = await prisma.constructionSalesGoal.findMany({
    where: { tenantId, year },
    orderBy: { month: "asc" },
  });

  const results: SalesGoalView[] = [];
  for (const g of goals) {
    const start = new Date(g.year, g.month - 1, 1);
    const end = new Date(g.year, g.month, 0, 23, 59, 59);

    const approvedBudgets = await prisma.budget.findMany({
      where: {
        status: "APROVADO",
        approvedAt: { gte: start, lte: end },
        project: { tenantId },
      },
      select: { total: true },
    });
    const actualRevenue = approvedBudgets.reduce((sum, b) => sum + b.total, 0);
    const coveragePercent =
      g.targetRevenue > 0 ? Math.round((actualRevenue / g.targetRevenue) * 100) : 0;

    results.push({
      id: g.id,
      year: g.year,
      month: g.month,
      targetRevenue: g.targetRevenue,
      targetBdiCoverage: g.targetBdiCoverage,
      notes: g.notes,
      actualRevenue,
      coveragePercent,
    });
  }
  return results;
}

export async function upsertSalesGoal(
  tenantId: string,
  input: {
    year: number;
    month: number;
    targetRevenue: number;
    targetBdiCoverage: number;
    notes?: string | null;
  },
): Promise<{ data: SalesGoalView } | { error: string }> {
  const prisma = await getPrisma();
  const row = await prisma.constructionSalesGoal.upsert({
    where: {
      tenantId_year_month: { tenantId, year: input.year, month: input.month },
    },
    create: {
      tenantId,
      year: input.year,
      month: input.month,
      targetRevenue: input.targetRevenue,
      targetBdiCoverage: input.targetBdiCoverage,
      notes: input.notes ?? null,
    },
    update: {
      targetRevenue: input.targetRevenue,
      targetBdiCoverage: input.targetBdiCoverage,
      notes: input.notes ?? null,
    },
  });

  const goals = await listSalesGoals(tenantId, row.year);
  const view = goals.find((g) => g.month === row.month);
  if (!view) return { error: "Meta não encontrada" };
  return { data: view };
}

function mapPipelineEntry(row: {
  id: string;
  contactName: string;
  projectName: string | null;
  estimatedValue: number;
  status: string;
  probability: number;
  expectedClose: Date | null;
  company: { name: string } | null;
  projectId: string | null;
  notes: string | null;
}): PipelineEntryView {
  return {
    id: row.id,
    contactName: row.contactName,
    projectName: row.projectName,
    estimatedValue: row.estimatedValue,
    status: row.status,
    statusLabel: labelOf(PIPELINE_STATUSES, row.status),
    probability: row.probability,
    expectedClose: row.expectedClose?.toISOString() ?? null,
    companyName: row.company?.name ?? null,
    projectId: row.projectId,
    notes: row.notes,
    weightedValue: row.estimatedValue * (row.probability / 100),
  };
}
