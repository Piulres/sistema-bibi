import "server-only";
import { getPrisma } from "@/lib/db";
import { getProjectCashSummary } from "@/lib/project/cash-service";
import { labelOf, INDIRECT_CATEGORIES } from "@/lib/project/construction-modules";

export type TaskFinancialView = {
  id: string;
  name: string;
  phase: string;
  plannedTotal: number;
  actualTotal: number;
  variance: number;
  progressPercent: number;
  startDate: string | null;
  endDate: string | null;
};

export type ProjectFinancialReport = {
  projectId: string;
  projectCode: string;
  projectName: string;
  budgetTotal: number;
  cashSummary: Awaited<ReturnType<typeof getProjectCashSummary>>;
  tasks: TaskFinancialView[];
  plannedTaskCost: number;
  actualTaskCost: number;
  physicalProgress: number;
  financialProgress: number;
};

export type CompanyFinancialReport = {
  projects: ProjectFinancialReport[];
  indirectPlanned: number;
  indirectActual: number;
  totalPlannedIncome: number;
  totalActualIncome: number;
  totalPlannedExpense: number;
  totalActualExpense: number;
  cashFlowProjection: number;
};

export type IndirectExpenseView = {
  id: string;
  category: string;
  categoryLabel: string;
  description: string;
  amount: number;
  isPlanned: boolean;
  expenseDate: string;
};

export async function getProjectFinancialReport(
  tenantId: string,
  projectId: string,
): Promise<ProjectFinancialReport | null> {
  const prisma = await getPrisma();
  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId },
    include: {
      budgets: { where: { status: { not: "SUBSTITUIDO" } }, orderBy: { version: "desc" }, take: 1 },
      tasks: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!project) return null;

  const cashSummary = await getProjectCashSummary(tenantId, projectId);
  const budgetTotal = project.budgets[0]?.total ?? 0;

  const tasks: TaskFinancialView[] = project.tasks.map((t) => {
    const plannedTotal = t.plannedLaborCost + t.plannedMaterialCost;
    const actualTotal = t.actualLaborCost + t.actualMaterialCost;
    return {
      id: t.id,
      name: t.name,
      phase: t.phase,
      plannedTotal,
      actualTotal,
      variance: actualTotal - plannedTotal,
      progressPercent: t.progressPercent,
      startDate: t.startDate?.toISOString() ?? null,
      endDate: t.endDate?.toISOString() ?? null,
    };
  });

  const plannedTaskCost = tasks.reduce((s, t) => s + t.plannedTotal, 0);
  const actualTaskCost = tasks.reduce((s, t) => s + t.actualTotal, 0);
  const physicalProgress = project.progressPercent;
  const financialProgress =
    plannedTaskCost > 0 ? Math.min(100, Math.round((actualTaskCost / plannedTaskCost) * 100)) : 0;

  return {
    projectId: project.id,
    projectCode: project.code,
    projectName: project.name,
    budgetTotal,
    cashSummary,
    tasks,
    plannedTaskCost,
    actualTaskCost,
    physicalProgress,
    financialProgress,
  };
}

export async function getCompanyFinancialReport(tenantId: string): Promise<CompanyFinancialReport> {
  const prisma = await getPrisma();
  const projects = await prisma.project.findMany({
    where: { tenantId, status: { notIn: ["CANCELADO"] } },
    select: { id: true },
  });

  const reports: ProjectFinancialReport[] = [];
  for (const p of projects) {
    const report = await getProjectFinancialReport(tenantId, p.id);
    if (report) reports.push(report);
  }

  const indirects = await prisma.companyIndirectExpense.findMany({ where: { tenantId } });
  const indirectPlanned = indirects.filter((e) => e.isPlanned).reduce((s, e) => s + e.amount, 0);
  const indirectActual = indirects.filter((e) => !e.isPlanned).reduce((s, e) => s + e.amount, 0);

  const totalPlannedIncome = reports.reduce((s, r) => s + r.cashSummary.plannedIncome, 0);
  const totalActualIncome = reports.reduce((s, r) => s + r.cashSummary.actualIncome, 0);
  const totalPlannedExpense =
    reports.reduce((s, r) => s + r.cashSummary.plannedExpense, 0) + indirectPlanned;
  const totalActualExpense =
    reports.reduce((s, r) => s + r.cashSummary.actualExpense, 0) + indirectActual;

  return {
    projects: reports,
    indirectPlanned,
    indirectActual,
    totalPlannedIncome,
    totalActualIncome,
    totalPlannedExpense,
    totalActualExpense,
    cashFlowProjection: totalPlannedIncome - totalPlannedExpense,
  };
}

export async function listIndirectExpenses(tenantId: string): Promise<IndirectExpenseView[]> {
  const prisma = await getPrisma();
  const rows = await prisma.companyIndirectExpense.findMany({
    where: { tenantId },
    orderBy: { expenseDate: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    category: r.category,
    categoryLabel: labelOf(INDIRECT_CATEGORIES, r.category),
    description: r.description,
    amount: r.amount,
    isPlanned: r.isPlanned,
    expenseDate: r.expenseDate.toISOString(),
  }));
}

export async function upsertIndirectExpense(
  tenantId: string,
  input: {
    id?: string;
    category: string;
    description: string;
    amount: number;
    isPlanned: boolean;
    expenseDate: string;
  },
): Promise<{ data: IndirectExpenseView } | { error: string }> {
  const prisma = await getPrisma();
  const payload = {
    category: input.category,
    description: input.description,
    amount: input.amount,
    isPlanned: input.isPlanned,
    expenseDate: new Date(input.expenseDate),
  };

  const row = input.id
    ? await prisma.companyIndirectExpense.update({ where: { id: input.id }, data: payload })
    : await prisma.companyIndirectExpense.create({ data: { ...payload, tenantId } });

  return {
    data: {
      id: row.id,
      category: row.category,
      categoryLabel: labelOf(INDIRECT_CATEGORIES, row.category),
      description: row.description,
      amount: row.amount,
      isPlanned: row.isPlanned,
      expenseDate: row.expenseDate.toISOString(),
    },
  };
}

export async function listProjectsForPatient(
  tenantId: string,
  patientId: string,
): Promise<
  {
    id: string;
    code: string;
    name: string;
    status: string;
    progressPercent: number;
    startDate: string | null;
    endDate: string | null;
    recentPhotos: { id: string; fileName: string; downloadUrl: string }[];
  }[]
> {
  const prisma = await getPrisma();
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, tenantId },
    select: { companyId: true },
  });
  if (!patient?.companyId) return [];

  const projects = await prisma.project.findMany({
    where: { tenantId, companyId: patient.companyId },
    orderBy: { updatedAt: "desc" },
  });

  const results = [];
  for (const p of projects) {
    const photos = await prisma.attachment.findMany({
      where: {
        tenantId,
        entityType: "DailyFieldReport",
        category: "FOTO_CAMPO",
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
    const fieldReportIds = (
      await prisma.dailyFieldReport.findMany({
        where: { projectId: p.id },
        select: { id: true },
      })
    ).map((r) => r.id);

    const projectPhotos = photos
      .filter((a) => fieldReportIds.includes(a.entityId))
      .map((a) => ({
        id: a.id,
        fileName: a.fileName,
        downloadUrl: `/api/beneficiario/projects/attachments/${a.id}/download`,
      }));

    results.push({
      id: p.id,
      code: p.code,
      name: p.name,
      status: p.status,
      progressPercent: p.progressPercent,
      startDate: p.startDate?.toISOString() ?? null,
      endDate: p.endDate?.toISOString() ?? null,
      recentPhotos: projectPhotos,
    });
  }
  return results;
}

export async function getProjectForPatient(
  tenantId: string,
  patientId: string,
  projectId: string,
): Promise<{
  id: string;
  code: string;
  name: string;
  status: string;
  progressPercent: number;
  startDate: string | null;
  endDate: string | null;
  tasks: TaskFinancialView[];
  contracts: { title: string; consolidatedValue: number }[];
} | null> {
  const prisma = await getPrisma();
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, tenantId },
    select: { companyId: true },
  });
  if (!patient?.companyId) return null;

  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId, companyId: patient.companyId },
    include: {
      tasks: { orderBy: { sortOrder: "asc" } },
      contracts: { include: { addendums: true } },
    },
  });
  if (!project) return null;

  const report = await getProjectFinancialReport(tenantId, projectId);

  return {
    id: project.id,
    code: project.code,
    name: project.name,
    status: project.status,
    progressPercent: project.progressPercent,
    startDate: project.startDate?.toISOString() ?? null,
    endDate: project.endDate?.toISOString() ?? null,
    tasks: report?.tasks ?? [],
    contracts: project.contracts.map((c) => {
      const addendumDelta = c.addendums
        .filter((a) => a.status === "ASSINADO" || a.status === "APROVADO")
        .reduce((s, a) => s + a.valueDelta, 0);
      return { title: c.title, consolidatedValue: c.totalValue + addendumDelta };
    }),
  };
}
