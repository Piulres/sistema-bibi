import type { PrismaClient } from "@prisma/client";

/** Massa demo dos pacotes 1–5 (caixa, alocação, ambientes, pipeline, contratos). */
export async function seedConstructionRoadmap(prisma: PrismaClient): Promise<number> {
  const tenant = await prisma.tenant.findUnique({ where: { slug: "build" } });
  if (!tenant) return 0;

  const project = await prisma.project.findFirst({
    where: { tenantId: tenant.id, code: "OBR-2026-001" },
    include: { budgets: { where: { status: "APROVADO" }, take: 1 } },
  });
  if (!project) return 0;

  const pedreiro = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: "pedreiro.jose@build.demo" },
  });

  const budget = project.budgets[0];
  if (budget) {
    await prisma.budgetBdiBreakdown.upsert({
      where: { budgetId: budget.id },
      create: {
        budgetId: budget.id,
        administration: 5,
        risk: 3,
        profit: 12,
        taxes: 3,
        financial: 2,
      },
      update: {},
    });
  }

  const envCount = await prisma.projectEnvironment.count({ where: { projectId: project.id } });
  if (envCount === 0) {
    await prisma.projectEnvironment.createMany({
      data: [
        {
          tenantId: tenant.id,
          projectId: project.id,
          name: "Sala de estar",
          environmentType: "RESIDENCIAL",
          length: 5.2,
          width: 4.1,
          height: 2.8,
          floorArea: 21.32,
          wallArea: 52.08,
          ceilingArea: 21.32,
          sortOrder: 0,
        },
        {
          tenantId: tenant.id,
          projectId: project.id,
          name: "Open space corporativo",
          environmentType: "CORPORATIVO",
          length: 12,
          width: 8,
          height: 3,
          floorArea: 96,
          wallArea: 120,
          ceilingArea: 96,
          sortOrder: 1,
        },
      ],
    });
  }

  const cashCount = await prisma.projectCashEntry.count({ where: { projectId: project.id } });
  if (cashCount === 0 && budget) {
    await prisma.projectCashEntry.createMany({
      data: [
        {
          tenantId: tenant.id,
          projectId: project.id,
          type: "ENTRADA",
          category: "CONTRATO",
          description: "Parcela 1 — contrato obra fechada",
          amount: budget.total * 0.3,
          isPlanned: true,
          entryDate: new Date(2026, 0, 20),
        },
        {
          tenantId: tenant.id,
          projectId: project.id,
          type: "ENTRADA",
          category: "MEDICAO",
          description: "Medição março (realizado)",
          amount: budget.total * 0.15,
          isPlanned: false,
          entryDate: new Date(2026, 2, 15),
        },
        {
          tenantId: tenant.id,
          projectId: project.id,
          type: "SAIDA",
          category: "MATERIAL",
          description: "Materiais alvenaria",
          amount: 18500,
          isPlanned: true,
          entryDate: new Date(2026, 1, 10),
        },
        {
          tenantId: tenant.id,
          projectId: project.id,
          type: "SAIDA",
          category: "MAO_OBRA",
          description: "Diárias equipe fevereiro",
          amount: 9200,
          isPlanned: false,
          entryDate: new Date(2026, 1, 28),
        },
      ],
    });
  }

  if (pedreiro) {
    const allocCount = await prisma.projectAllocation.count({ where: { projectId: project.id } });
    if (allocCount === 0) {
      const alloc = await prisma.projectAllocation.create({
        data: {
          tenantId: tenant.id,
          projectId: project.id,
          providerId: pedreiro.id,
          trade: "Pedreiro",
          contractType: "DIARIA",
          contractValue: 12000,
          dailyRate: 280,
          status: "ATIVO",
        },
      });
      await prisma.projectAllocationPayment.create({
        data: {
          allocationId: alloc.id,
          amount: 1400,
          paymentType: "ADIANTAMENTO",
          paymentDate: new Date(2026, 1, 5),
          notes: "Adiantamento diárias",
        },
      });
    }
  }

  const tasks = await prisma.projectTask.findMany({ where: { projectId: project.id } });
  for (const t of tasks) {
    if (t.plannedLaborCost === 0) {
      await prisma.projectTask.update({
        where: { id: t.id },
        data: {
          plannedLaborCost: 8000 + t.sortOrder * 2000,
          plannedMaterialCost: 5000 + t.sortOrder * 1500,
          actualLaborCost: t.status === "CONCLUIDO" ? 7500 + t.sortOrder * 1800 : 3000,
          actualMaterialCost: t.status === "CONCLUIDO" ? 4800 + t.sortOrder * 1400 : 2000,
        },
      });
    }
  }

  const contractCount = await prisma.projectContract.count({ where: { projectId: project.id } });
  if (contractCount === 0 && budget) {
    const contract = await prisma.projectContract.create({
      data: {
        tenantId: tenant.id,
        projectId: project.id,
        contractNumber: "CT-2026-001",
        title: "Contrato de reforma Torre A",
        totalValue: budget.total,
        status: "ASSINADO",
        signedAt: new Date(2026, 0, 10),
      },
    });
    await prisma.contractAddendum.create({
      data: {
        contractId: contract.id,
        addendumNumber: 1,
        title: "Ampliação área elétrica",
        description: "Pontos extras no open space",
        valueDelta: 8500,
        scheduleDeltaDays: 7,
        status: "ASSINADO",
        signedAt: new Date(2026, 2, 1),
      },
    });
  }

  const pipelineCount = await prisma.constructionPipelineEntry.count({ where: { tenantId: tenant.id } });
  if (pipelineCount === 0) {
    await prisma.constructionPipelineEntry.createMany({
      data: [
        {
          tenantId: tenant.id,
          contactName: "Marina Costa",
          projectName: "Reforma cobertura",
          estimatedValue: 180000,
          status: "PROPOSTA",
          probability: 60,
        },
        {
          tenantId: tenant.id,
          contactName: "Grupo Beta Inc.",
          projectName: "Retrofit escritório",
          estimatedValue: 420000,
          status: "NEGOCIACAO",
          probability: 40,
        },
      ],
    });
  }

  await prisma.constructionSalesGoal.upsert({
    where: { tenantId_year_month: { tenantId: tenant.id, year: 2026, month: 6 } },
    create: {
      tenantId: tenant.id,
      year: 2026,
      month: 6,
      targetRevenue: 500000,
      targetBdiCoverage: 85,
      notes: "Meta demo homologação",
    },
    update: {},
  });

  const indirectCount = await prisma.companyIndirectExpense.count({ where: { tenantId: tenant.id } });
  if (indirectCount === 0) {
    await prisma.companyIndirectExpense.createMany({
      data: [
        {
          tenantId: tenant.id,
          category: "ALUGUEL",
          description: "Sede administrativa",
          amount: 12000,
          isPlanned: true,
          expenseDate: new Date(2026, 5, 5),
        },
        {
          tenantId: tenant.id,
          category: "ADMINISTRATIVO",
          description: "Folha backoffice",
          amount: 28000,
          isPlanned: false,
          expenseDate: new Date(2026, 5, 10),
        },
      ],
    });
  }

  return 1;
}
