import type { PrismaClient } from "@prisma/client";

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
        { name: "Demolição", phase: "GERAL", status: "CONCLUIDO", progressPercent: 100, sortOrder: 0 },
        { name: "Alvenaria", phase: "ESTRUTURA", status: "EM_ANDAMENTO", progressPercent: 60, sortOrder: 1 },
        { name: "Elétrica", phase: "ACABAMENTO", status: "PENDENTE", progressPercent: 0, sortOrder: 2 },
        { name: "Pintura", phase: "ACABAMENTO", status: "PENDENTE", progressPercent: 0, sortOrder: 3 },
      ],
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
        { name: "Vistoria in loco", phase: "GERAL", status: "PENDENTE", progressPercent: 0, sortOrder: 0 },
        { name: "Elaboração do laudo", phase: "GERAL", status: "PENDENTE", progressPercent: 0, sortOrder: 1 },
      ],
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
      tasks: [],
    },
  ];

  let count = 0;

  for (const spec of projects) {
    const subtotal = spec.budget.lineItems.reduce(
      (s, li) => s + li.quantity * li.unitPrice,
      0,
    );
    const total = subtotal * (1 + spec.budget.bdiPercent / 100);

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
          create: spec.tasks.map((t) => ({
            name: t.name,
            phase: t.phase,
            status: t.status,
            progressPercent: t.progressPercent,
            sortOrder: t.sortOrder,
            assigneeId: t.status === "EM_ANDAMENTO" ? engPaulo?.id : manager?.id,
            startDate: spec.startDate,
            endDate: spec.endDate,
          })),
        },
      },
    });

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

  return count;
}
