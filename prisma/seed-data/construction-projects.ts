import type { PrismaClient } from "@prisma/client";

type TaskSeed = {
  name: string;
  phase: string;
  status: string;
  progressPercent: number;
  sortOrder: number;
  /** Dias após startDate da obra */
  startOffsetDays?: number;
  durationDays?: number;
  dependsOnSortOrder?: number;
};

/** Massa demo de obras para o tenant Build Engenharia (CONSTRUCTION). */
export async function seedConstructionProjects(prisma: PrismaClient): Promise<number> {
  const tenant = await prisma.tenant.findUnique({ where: { slug: "build" } });
  if (!tenant) return 0;

  const company = await prisma.company.findFirst({
    where: { tenantId: tenant.id, name: "Incorp Alpha" },
  });
  const manager = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: "eng.carlos@build.demo" },
  });
  const engPaulo = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: "eng.paulo@build.demo" },
  });
  const pedreiroJose = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: "pedreiro.jose@build.demo" },
  });

  const alreadySeeded = await prisma.project.findFirst({
    where: { tenantId: tenant.id, code: "OBR-2026-001" },
  });
  if (alreadySeeded) return 0;

  const projects = [
    {
      code: "OBR-2026-001",
      name: "Reforma Torre A — 12º andar",
      status: "EM_OBRA",
      addressCity: "São Paulo",
      addressState: "SP",
      progressPercent: 45,
      startDate: new Date(2026, 0, 15),
      endDate: new Date(2026, 5, 30),
      budget: {
        status: "APROVADO",
        bdiPercent: 25,
        lineItems: [
          { description: "Demolição de paredes", unit: "m²", quantity: 80, unitPrice: 45 },
          { description: "Alvenaria estrutural", unit: "m²", quantity: 120, unitPrice: 85 },
          { description: "Instalação elétrica", unit: "pt", quantity: 45, unitPrice: 120 },
          { description: "Pintura acabamento", unit: "m²", quantity: 200, unitPrice: 28 },
        ],
      },
      tasks: [
        {
          name: "Demolição",
          phase: "GERAL",
          status: "CONCLUIDO",
          progressPercent: 100,
          sortOrder: 0,
          startOffsetDays: 0,
          durationDays: 21,
        },
        {
          name: "Alvenaria",
          phase: "ESTRUTURA",
          status: "EM_ANDAMENTO",
          progressPercent: 60,
          sortOrder: 1,
          startOffsetDays: 22,
          durationDays: 45,
          dependsOnSortOrder: 0,
        },
        {
          name: "Elétrica",
          phase: "ACABAMENTO",
          status: "PENDENTE",
          progressPercent: 0,
          sortOrder: 2,
          startOffsetDays: 68,
          durationDays: 30,
          dependsOnSortOrder: 1,
        },
        {
          name: "Pintura",
          phase: "ACABAMENTO",
          status: "PENDENTE",
          progressPercent: 0,
          sortOrder: 3,
          startOffsetDays: 99,
          durationDays: 25,
          dependsOnSortOrder: 2,
        },
      ] satisfies TaskSeed[],
    },
    {
      code: "OBR-2026-002",
      name: "Laudo estrutural — Edifício Comercial Centro",
      status: "PROPOSTA",
      addressCity: "São Paulo",
      addressState: "SP",
      progressPercent: 0,
      budget: {
        status: "ENVIADO",
        bdiPercent: 20,
        lineItems: [
          { description: "Vistoria técnica inicial", unit: "un", quantity: 1, unitPrice: 450 },
          { description: "Laudo estrutural completo", unit: "un", quantity: 1, unitPrice: 2500 },
          { description: "Emissão de ART", unit: "un", quantity: 1, unitPrice: 180 },
        ],
      },
      tasks: [
        {
          name: "Vistoria in loco",
          phase: "GERAL",
          status: "PENDENTE",
          progressPercent: 0,
          sortOrder: 0,
          startOffsetDays: 0,
          durationDays: 7,
        },
        {
          name: "Elaboração do laudo",
          phase: "GERAL",
          status: "PENDENTE",
          progressPercent: 0,
          sortOrder: 1,
          startOffsetDays: 8,
          durationDays: 14,
          dependsOnSortOrder: 0,
        },
      ] satisfies TaskSeed[],
    },
    {
      code: "OBR-2026-003",
      name: "Fiscalização mensal — Residencial Horizonte",
      status: "ORCAMENTO",
      addressCity: "Campinas",
      addressState: "SP",
      progressPercent: 0,
      budget: {
        status: "RASCUNHO",
        bdiPercent: 15,
        lineItems: [
          { description: "Fiscalização de obra (mensal)", unit: "mês", quantity: 6, unitPrice: 3200 },
          { description: "Relatórios fotográficos", unit: "un", quantity: 6, unitPrice: 350 },
        ],
      },
      tasks: [] as TaskSeed[],
    },
  ];

  let count = 0;

  for (const spec of projects) {
    const subtotal = spec.budget.lineItems.reduce(
      (s, li) => s + li.quantity * li.unitPrice,
      0,
    );
    const total = subtotal * (1 + spec.budget.bdiPercent / 100);
    const obraStart = spec.startDate ?? new Date(2026, 2, 1);

    const project = await prisma.project.create({
      data: {
        tenantId: tenant.id,
        companyId: company?.id,
        managerId: manager?.id,
        code: spec.code,
        name: spec.name,
        status: spec.status,
        addressCity: spec.addressCity,
        addressState: spec.addressState,
        progressPercent: spec.progressPercent,
        startDate: spec.startDate,
        endDate: spec.endDate,
        billingMode:
          spec.code === "OBR-2026-001" ? "MISTO" : spec.code === "OBR-2026-002" ? "FECHADO" : "DIARIA",
        budgets: {
          create: {
            version: 1,
            status: spec.budget.status,
            bdiPercent: spec.budget.bdiPercent,
            subtotal,
            total,
            sentAt: spec.budget.status === "ENVIADO" ? new Date() : null,
            approvedAt: spec.budget.status === "APROVADO" ? new Date() : null,
            lineItems: {
              create: spec.budget.lineItems.map((li, idx) => ({
                description: li.description,
                unit: li.unit,
                quantity: li.quantity,
                unitPrice: li.unitPrice,
                total: li.quantity * li.unitPrice,
                sortOrder: idx,
              })),
            },
          },
        },
        tasks: {
          create: spec.tasks.map((t) => {
            const start = new Date(obraStart);
            start.setDate(start.getDate() + (t.startOffsetDays ?? 0));
            const end = new Date(start);
            end.setDate(end.getDate() + (t.durationDays ?? 14));
            return {
              name: t.name,
              phase: t.phase,
              status: t.status,
              progressPercent: t.progressPercent,
              sortOrder: t.sortOrder,
              assigneeId:
                t.name === "Demolição" && pedreiroJose
                  ? pedreiroJose.id
                  : t.status === "EM_ANDAMENTO"
                    ? engPaulo?.id
                    : manager?.id,
              startDate: start,
              endDate: end,
            };
          }),
        },
      },
      include: { budgets: true, tasks: { orderBy: { sortOrder: "asc" } } },
    });

    for (const t of spec.tasks) {
      if (t.dependsOnSortOrder === undefined) continue;
      const dep = project.tasks.find((x) => x.sortOrder === t.dependsOnSortOrder);
      const task = project.tasks.find((x) => x.sortOrder === t.sortOrder);
      if (dep && task) {
        await prisma.projectTask.update({
          where: { id: task.id },
          data: { dependsOnId: dep.id },
        });
      }
    }

    if (spec.budget.status === "APROVADO" && company) {
      const patient = await prisma.patient.findFirst({
        where: { tenantId: tenant.id, companyId: company.id },
        orderBy: { createdAt: "asc" },
      });
      const budget = project.budgets[0];
      if (patient && budget) {
        const invoice = await prisma.invoice.create({
          data: {
            tenantId: tenant.id,
            patientId: patient.id,
            companyId: company.id,
            total: budget.total,
            status: "FECHADA",
            items: {
              create: spec.budget.lineItems.map((li) => ({
                description: `${spec.code} — ${li.description}`,
                amount: li.quantity * li.unitPrice,
              })),
            },
          },
        });
        await prisma.budget.update({
          where: { id: budget.id },
          data: { invoiceId: invoice.id },
        });
      }
    }

    await prisma.attachment.create({
      data: {
        tenantId: tenant.id,
        entityType: "Project",
        entityId: project.id,
        fileName: `${spec.code}-memorial-descritivo.pdf`,
        contentType: "application/pdf",
        blobKey: `seed/${tenant.id}/${project.id}/memorial.pdf`,
        category: "MEMORIAL",
        sizeBytes: 245_760,
        uploadedById: manager?.id,
      },
    });

    count += 1;
  }

  const obra001 = await prisma.project.findFirst({
    where: { tenantId: tenant.id, code: "OBR-2026-001" },
    include: { tasks: { where: { name: "Alvenaria" }, take: 1 } },
  });
  if (obra001 && pedreiroJose) {
    await prisma.dailyFieldReport.create({
      data: {
        tenantId: tenant.id,
        projectId: obra001.id,
        taskId: obra001.tasks[0]?.id ?? null,
        authorId: pedreiroJose.id,
        reportDate: new Date(),
        trade: "PEDREIRO",
        locationNote: "12º andar — área molhada",
        workDone: "Conclusão de 12 m² de alvenaria no banheiro principal. Argamassa aplicada.",
        pendingWork: "Aguardar cura para iniciar revestimento. Necessário 2 sacos de cimento.",
        progressPercent: 65,
        diariaAmount: 280,
        status: "ENVIADO",
      },
    });
  }

  return count;
}
