import "server-only";
import { getPrisma } from "@/lib/db";
import {
  attachmentCategoryLabel,
  budgetStatusLabel,
  isAttachmentCategory,
  isAttachmentEntityType,
  isProjectStatus,
  isTaskStatus,
  projectStatusLabel,
  taskPhaseLabel,
  taskStatusLabel,
  type AttachmentEntityType,
} from "@/lib/project/constants";
import {
  buildAttachmentBlobKey,
  readAttachmentFile,
  saveAttachmentFile,
} from "@/lib/storage/attachments";
import { recordTimelineEvent, TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline";
import { formatBRL } from "@/lib/pricing";
import { dispatchWebhooks } from "@/lib/webhook-service";
import { resolveInvoicePatientForCompany } from "@/lib/project/company-patient";
import { mirrorProjectCashEntry } from "@/lib/project/cash-service";

export type ProjectListItem = {
  id: string;
  code: string;
  name: string;
  status: string;
  statusLabel: string;
  progressPercent: number;
  companyName: string | null;
  managerName: string | null;
  addressCity: string | null;
  addressState: string | null;
  budgetTotal: number | null;
  budgetStatus: string | null;
  taskCount: number;
  attachmentCount: number;
  startDate: string | null;
  endDate: string | null;
};

export type BudgetLineItemView = {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
  sortOrder: number;
};

export type BudgetView = {
  id: string;
  version: number;
  status: string;
  statusLabel: string;
  subtotal: number;
  bdiPercent: number;
  total: number;
  validUntil: string | null;
  notes: string | null;
  sentAt: string | null;
  approvedAt: string | null;
  invoiceId: string | null;
  lineItems: BudgetLineItemView[];
};

export type TaskView = {
  id: string;
  name: string;
  phase: string;
  phaseLabel: string;
  status: string;
  statusLabel: string;
  startDate: string | null;
  endDate: string | null;
  progressPercent: number;
  assigneeName: string | null;
  dependsOnId: string | null;
  dependsOnName: string | null;
  sortOrder: number;
};

export type AttachmentView = {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  contentType: string;
  category: string;
  categoryLabel: string;
  sizeBytes: number;
  createdAt: string;
  uploadedByName: string | null;
  downloadUrl: string;
};

export type ProjectDetail = {
  id: string;
  code: string;
  name: string;
  status: string;
  statusLabel: string;
  progressPercent: number;
  notes: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZip: string | null;
  startDate: string | null;
  endDate: string | null;
  companyId: string | null;
  companyName: string | null;
  managerId: string | null;
  managerName: string | null;
  budgets: BudgetView[];
  tasks: TaskView[];
  attachments: AttachmentView[];
};

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function computeBudgetTotals(
  lineItems: { quantity: number; unitPrice: number }[],
  bdiPercent: number,
) {
  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
  const total = subtotal * (1 + bdiPercent / 100);
  return { subtotal, total };
}

function computeProjectProgress(tasks: { progressPercent: number }[]): number {
  if (tasks.length === 0) return 0;
  const sum = tasks.reduce((acc, t) => acc + t.progressPercent, 0);
  return Math.round((sum / tasks.length) * 10) / 10;
}

async function syncProjectProgress(projectId: string) {
  const prisma = await getPrisma();
  const tasks = await prisma.projectTask.findMany({ where: { projectId } });
  const progress = computeProjectProgress(tasks);
  await prisma.project.update({ where: { id: projectId }, data: { progressPercent: progress } });
  return progress;
}

function mapLineItem(li: {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
  sortOrder: number;
}): BudgetLineItemView {
  return {
    id: li.id,
    description: li.description,
    unit: li.unit,
    quantity: li.quantity,
    unitPrice: li.unitPrice,
    total: li.total,
    sortOrder: li.sortOrder,
  };
}

function mapBudget(b: {
  id: string;
  version: number;
  status: string;
  subtotal: number;
  bdiPercent: number;
  total: number;
  validUntil: Date | null;
  notes: string | null;
  sentAt: Date | null;
  approvedAt: Date | null;
  invoiceId?: string | null;
  lineItems: {
    id: string;
    description: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    total: number;
    sortOrder: number;
  }[];
}): BudgetView {
  return {
    id: b.id,
    version: b.version,
    status: b.status,
    statusLabel: budgetStatusLabel(b.status),
    subtotal: b.subtotal,
    bdiPercent: b.bdiPercent,
    total: b.total,
    validUntil: iso(b.validUntil),
    notes: b.notes,
    sentAt: iso(b.sentAt),
    approvedAt: iso(b.approvedAt),
    invoiceId: b.invoiceId ?? null,
    lineItems: b.lineItems.map(mapLineItem).sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

function mapTask(t: {
  id: string;
  name: string;
  phase: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  progressPercent: number;
  sortOrder: number;
  dependsOnId?: string | null;
  assignee: { name: string } | null;
  dependsOn?: { name: string } | null;
}): TaskView {
  return {
    id: t.id,
    name: t.name,
    phase: t.phase,
    phaseLabel: taskPhaseLabel(t.phase),
    status: t.status,
    statusLabel: taskStatusLabel(t.status),
    startDate: iso(t.startDate),
    endDate: iso(t.endDate),
    progressPercent: t.progressPercent,
    assigneeName: t.assignee?.name ?? null,
    dependsOnId: t.dependsOnId ?? null,
    dependsOnName: t.dependsOn?.name ?? null,
    sortOrder: t.sortOrder,
  };
}

function mapAttachment(a: {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  contentType: string;
  category: string;
  sizeBytes: number;
  createdAt: Date;
  uploadedBy: { name: string } | null;
}): AttachmentView {
  return {
    id: a.id,
    entityType: a.entityType,
    entityId: a.entityId,
    fileName: a.fileName,
    contentType: a.contentType,
    category: a.category,
    categoryLabel: attachmentCategoryLabel(a.category),
    sizeBytes: a.sizeBytes,
    createdAt: a.createdAt.toISOString(),
    uploadedByName: a.uploadedBy?.name ?? null,
    downloadUrl: `/api/interno/attachments/${a.id}/download`,
  };
}

export async function listProjects(tenantId: string): Promise<ProjectListItem[]> {
  const prisma = await getPrisma();
  const projects = await prisma.project.findMany({
    where: { tenantId },
    include: {
      company: { select: { name: true } },
      manager: { select: { name: true } },
      budgets: { orderBy: { version: "desc" }, take: 1 },
      tasks: { select: { id: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const attachmentCounts = await prisma.attachment.groupBy({
    by: ["entityId"],
    where: { tenantId, entityType: "Project" },
    _count: { id: true },
  });
  const attMap = new Map(attachmentCounts.map((a) => [a.entityId, a._count.id]));

  return projects.map((p) => {
    const latestBudget = p.budgets[0];
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      status: p.status,
      statusLabel: projectStatusLabel(p.status),
      progressPercent: p.progressPercent,
      companyName: p.company?.name ?? null,
      managerName: p.manager?.name ?? null,
      addressCity: p.addressCity,
      addressState: p.addressState,
      budgetTotal: latestBudget?.total ?? null,
      budgetStatus: latestBudget?.status ?? null,
      taskCount: p.tasks.length,
      attachmentCount: attMap.get(p.id) ?? 0,
      startDate: iso(p.startDate),
      endDate: iso(p.endDate),
    };
  });
}

export async function getProjectDetail(
  tenantId: string,
  projectId: string,
): Promise<ProjectDetail | null> {
  const prisma = await getPrisma();
  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId },
    include: {
      company: { select: { id: true, name: true } },
      manager: { select: { id: true, name: true } },
      budgets: {
        include: { lineItems: true },
        orderBy: { version: "desc" },
      },
      tasks: {
        include: {
          assignee: { select: { name: true } },
          dependsOn: { select: { name: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!project) return null;

  const attachments = await prisma.attachment.findMany({
    where: {
      tenantId,
      OR: [
        { entityType: "Project", entityId: projectId },
        { entityType: "Budget", entityId: { in: project.budgets.map((b) => b.id) } },
      ],
    },
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return {
    id: project.id,
    code: project.code,
    name: project.name,
    status: project.status,
    statusLabel: projectStatusLabel(project.status),
    progressPercent: project.progressPercent,
    notes: project.notes,
    addressStreet: project.addressStreet,
    addressCity: project.addressCity,
    addressState: project.addressState,
    addressZip: project.addressZip,
    startDate: iso(project.startDate),
    endDate: iso(project.endDate),
    companyId: project.company?.id ?? null,
    companyName: project.company?.name ?? null,
    managerId: project.manager?.id ?? null,
    managerName: project.manager?.name ?? null,
    budgets: project.budgets.map(mapBudget),
    tasks: project.tasks.map(mapTask),
    attachments: attachments.map(mapAttachment),
  };
}

export async function createProject(input: {
  tenantId: string;
  code: string;
  name: string;
  status?: string;
  companyId?: string | null;
  managerId?: string | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZip?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
  createdBy: string;
}): Promise<{ project: ProjectDetail } | { error: string }> {
  const prisma = await getPrisma();
  const code = input.code.trim().toUpperCase();
  const name = input.name.trim();
  if (!code || !name) return { error: "Informe código e nome da obra" };
  if (input.status && !isProjectStatus(input.status)) return { error: "Status inválido" };

  const existing = await prisma.project.findUnique({
    where: { tenantId_code: { tenantId: input.tenantId, code } },
  });
  if (existing) return { error: "Já existe uma obra com este código" };

  const project = await prisma.project.create({
    data: {
      tenantId: input.tenantId,
      code,
      name,
      status: input.status ?? "ORCAMENTO",
      companyId: input.companyId ?? undefined,
      managerId: input.managerId ?? undefined,
      addressStreet: input.addressStreet?.trim() || null,
      addressCity: input.addressCity?.trim() || null,
      addressState: input.addressState?.trim() || null,
      addressZip: input.addressZip?.trim() || null,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      notes: input.notes?.trim() || null,
    },
  });

  await prisma.budget.create({
    data: { projectId: project.id, version: 1, status: "RASCUNHO" },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.PROJECT,
    entityId: project.id,
    action: TIMELINE_ACTIONS.CREATED,
    description: `Obra ${code} criada`,
    createdBy: input.createdBy,
  });

  const detail = await getProjectDetail(input.tenantId, project.id);
  return detail ? { project: detail } : { error: "Erro ao carregar obra" };
}

export async function updateProject(input: {
  tenantId: string;
  projectId: string;
  name?: string;
  status?: string;
  companyId?: string | null;
  managerId?: string | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZip?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
  updatedBy: string;
}): Promise<{ project: ProjectDetail } | { error: string }> {
  const prisma = await getPrisma();
  const existing = await prisma.project.findFirst({
    where: { id: input.projectId, tenantId: input.tenantId },
  });
  if (!existing) return { error: "Obra não encontrada" };
  if (input.status && !isProjectStatus(input.status)) return { error: "Status inválido" };

  await prisma.project.update({
    where: { id: input.projectId },
    data: {
      name: input.name?.trim() ?? undefined,
      status: input.status ?? undefined,
      companyId: input.companyId === undefined ? undefined : input.companyId,
      managerId: input.managerId === undefined ? undefined : input.managerId,
      addressStreet:
        input.addressStreet === undefined ? undefined : input.addressStreet?.trim() || null,
      addressCity: input.addressCity === undefined ? undefined : input.addressCity?.trim() || null,
      addressState:
        input.addressState === undefined ? undefined : input.addressState?.trim() || null,
      addressZip: input.addressZip === undefined ? undefined : input.addressZip?.trim() || null,
      startDate:
        input.startDate === undefined
          ? undefined
          : input.startDate
            ? new Date(input.startDate)
            : null,
      endDate:
        input.endDate === undefined
          ? undefined
          : input.endDate
            ? new Date(input.endDate)
            : null,
      notes: input.notes === undefined ? undefined : input.notes?.trim() || null,
    },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.PROJECT,
    entityId: input.projectId,
    action: TIMELINE_ACTIONS.UPDATED,
    description: `Obra ${existing.code} atualizada`,
    createdBy: input.updatedBy,
  });

  const detail = await getProjectDetail(input.tenantId, input.projectId);
  return detail ? { project: detail } : { error: "Erro ao carregar obra" };
}

export async function upsertBudget(input: {
  tenantId: string;
  projectId: string;
  budgetId?: string;
  bdiPercent?: number;
  validUntil?: string | null;
  notes?: string | null;
  lineItems: {
    description: string;
    unit?: string;
    quantity?: number;
    unitPrice?: number;
    sortOrder?: number;
  }[];
  updatedBy: string;
}): Promise<{ budget: BudgetView } | { error: string }> {
  const prisma = await getPrisma();
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, tenantId: input.tenantId },
  });
  if (!project) return { error: "Obra não encontrada" };

  const normalizedItems = input.lineItems.map((li, idx) => {
    const quantity = li.quantity ?? 1;
    const unitPrice = li.unitPrice ?? 0;
    return {
      description: li.description.trim(),
      unit: li.unit?.trim() || "un",
      quantity,
      unitPrice,
      total: quantity * unitPrice,
      sortOrder: li.sortOrder ?? idx,
    };
  });

  const bdiPercent = input.bdiPercent ?? 0;
  const { subtotal, total } = computeBudgetTotals(normalizedItems, bdiPercent);

  let budgetId = input.budgetId;
  if (!budgetId) {
    const latest = await prisma.budget.findFirst({
      where: { projectId: input.projectId },
      orderBy: { version: "desc" },
    });
    budgetId = latest?.id;
  }

  if (!budgetId) return { error: "Orçamento não encontrado" };

  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, projectId: input.projectId },
  });
  if (!budget) return { error: "Orçamento não encontrado" };
  if (budget.status === "APROVADO") return { error: "Orçamento aprovado não pode ser editado" };

  await prisma.budgetLineItem.deleteMany({ where: { budgetId } });
  await prisma.budget.update({
    where: { id: budgetId },
    data: {
      bdiPercent,
      subtotal,
      total,
      validUntil:
        input.validUntil === undefined
          ? undefined
          : input.validUntil
            ? new Date(input.validUntil)
            : null,
      notes: input.notes === undefined ? undefined : input.notes?.trim() || null,
      lineItems: { create: normalizedItems },
    },
  });

  const updated = await prisma.budget.findUniqueOrThrow({
    where: { id: budgetId },
    include: { lineItems: true },
  });

  return { budget: mapBudget(updated) };
}

export async function sendBudget(input: {
  tenantId: string;
  projectId: string;
  budgetId: string;
  updatedBy: string;
}): Promise<{ budget: BudgetView; project: ProjectDetail } | { error: string }> {
  const prisma = await getPrisma();
  const budget = await prisma.budget.findFirst({
    where: { id: input.budgetId, project: { id: input.projectId, tenantId: input.tenantId } },
    include: { lineItems: true },
  });
  if (!budget) return { error: "Orçamento não encontrado" };
  if (budget.lineItems.length === 0) return { error: "Adicione itens ao orçamento antes de enviar" };

  await prisma.budget.update({
    where: { id: budget.id },
    data: { status: "ENVIADO", sentAt: new Date() },
  });
  await prisma.project.update({
    where: { id: input.projectId },
    data: { status: "PROPOSTA" },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.BUDGET,
    entityId: budget.id,
    action: TIMELINE_ACTIONS.UPDATED,
    description: `Orçamento v${budget.version} enviado como proposta`,
    createdBy: input.updatedBy,
  });

  const detail = await getProjectDetail(input.tenantId, input.projectId);
  const updatedBudget = detail?.budgets.find((b) => b.id === budget.id);
  if (!detail || !updatedBudget) return { error: "Erro ao carregar obra" };
  return { budget: updatedBudget, project: detail };
}

export async function approveBudget(input: {
  tenantId: string;
  projectId: string;
  budgetId: string;
  updatedBy: string;
  approvedByPjUserId?: string | null;
}): Promise<
  | { budget: BudgetView; project: ProjectDetail; invoiceId?: string }
  | { error: string }
> {
  const prisma = await getPrisma();
  const budget = await prisma.budget.findFirst({
    where: { id: input.budgetId, project: { id: input.projectId, tenantId: input.tenantId } },
    include: { lineItems: true, project: true },
  });
  if (!budget) return { error: "Orçamento não encontrado" };
  if (budget.status !== "ENVIADO") return { error: "Somente propostas enviadas podem ser aprovadas" };
  if (budget.invoiceId) return { error: "Orçamento já faturado" };

  const invoiceResult = await createInvoiceFromBudget({
    tenantId: input.tenantId,
    projectId: input.projectId,
    budget,
    createdBy: input.updatedBy,
  });
  if ("error" in invoiceResult) return invoiceResult;

  await prisma.budget.update({
    where: { id: budget.id },
    data: {
      status: "APROVADO",
      approvedAt: new Date(),
      invoiceId: invoiceResult.invoiceId,
      approvedByPjUserId: input.approvedByPjUserId ?? null,
    },
  });
  await prisma.project.update({
    where: { id: input.projectId },
    data: { status: "APROVADO" },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.BUDGET,
    entityId: budget.id,
    action: TIMELINE_ACTIONS.UPDATED,
    description: `Orçamento v${budget.version} aprovado — fatura ${invoiceResult.invoiceId.slice(0, 8)}`,
    createdBy: input.updatedBy,
  });

  const detail = await getProjectDetail(input.tenantId, input.projectId);
  const updatedBudget = detail?.budgets.find((b) => b.id === budget.id);
  if (!detail || !updatedBudget) return { error: "Erro ao carregar obra" };
  return { budget: updatedBudget, project: detail, invoiceId: invoiceResult.invoiceId };
}

export async function rejectBudget(input: {
  tenantId: string;
  projectId: string;
  budgetId: string;
  updatedBy: string;
}): Promise<{ budget: BudgetView; project: ProjectDetail } | { error: string }> {
  const prisma = await getPrisma();
  const budget = await prisma.budget.findFirst({
    where: { id: input.budgetId, project: { id: input.projectId, tenantId: input.tenantId } },
  });
  if (!budget) return { error: "Orçamento não encontrado" };
  if (budget.status !== "ENVIADO") return { error: "Somente propostas enviadas podem ser recusadas" };

  await prisma.budget.update({
    where: { id: budget.id },
    data: { status: "REJEITADO", rejectedAt: new Date() },
  });
  await prisma.project.update({
    where: { id: input.projectId },
    data: { status: "ORCAMENTO" },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.BUDGET,
    entityId: budget.id,
    action: TIMELINE_ACTIONS.UPDATED,
    description: `Orçamento v${budget.version} recusado pelo cliente`,
    createdBy: input.updatedBy,
  });

  const detail = await getProjectDetail(input.tenantId, input.projectId);
  const updatedBudget = detail?.budgets.find((b) => b.id === budget.id);
  if (!detail || !updatedBudget) return { error: "Erro ao carregar obra" };
  return { budget: updatedBudget, project: detail };
}

async function createInvoiceFromBudget(input: {
  tenantId: string;
  projectId: string;
  budget: {
    id: string;
    version: number;
    total: number;
    lineItems: { description: string; total: number }[];
    project: { code: string; name: string; companyId: string | null };
  };
  createdBy: string;
}): Promise<{ invoiceId: string } | { error: string }> {
  const prisma = await getPrisma();
  const patient = input.budget.project.companyId
    ? await resolveInvoicePatientForCompany(
        input.tenantId,
        input.budget.project.companyId,
        "cliente@build.demo",
      )
    : null;

  if (!patient) {
    return {
      error:
        "Não há beneficiário vinculado à empresa para emitir fatura. Cadastre um cliente na empresa.",
    };
  }

  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        tenantId: input.tenantId,
        patientId: patient.id,
        companyId: input.budget.project.companyId,
        total: input.budget.total,
        status: "FECHADA",
        items: {
          create: input.budget.lineItems.map((li) => ({
            description: `${input.budget.project.code} — ${li.description}`,
            amount: li.total,
          })),
        },
      },
    });

    await recordTimelineEvent(
      {
        tenantId: input.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.INVOICE,
        entityId: created.id,
        action: TIMELINE_ACTIONS.INVOICE_ISSUED,
        description: `Fatura de obra ${input.budget.project.code} (orçamento v${input.budget.version}) — ${formatBRL(created.total)}`,
        createdBy: input.createdBy,
      },
      tx,
    );

    return created;
  });

  void dispatchWebhooks({
    tenantId: input.tenantId,
    event: "INVOICE_ISSUED",
    data: {
      invoiceId: invoice.id,
      patientId: patient.id,
      companyId: input.budget.project.companyId,
      total: invoice.total,
      status: invoice.status,
      projectId: input.projectId,
      budgetId: input.budget.id,
    },
  });

  await mirrorProjectCashEntry({
    tenantId: input.tenantId,
    projectId: input.projectId,
    type: "ENTRADA",
    category: "CONTRATO",
    description: `Orçamento v${input.budget.version} aprovado — ${input.budget.project.code}`,
    amount: invoice.total,
    referenceType: "Budget",
    referenceId: input.budget.id,
  });

  return { invoiceId: invoice.id };
}

export async function createBudgetVersion(input: {
  tenantId: string;
  projectId: string;
  sourceBudgetId: string;
  updatedBy: string;
}): Promise<{ budget: BudgetView } | { error: string }> {
  const prisma = await getPrisma();
  const source = await prisma.budget.findFirst({
    where: {
      id: input.sourceBudgetId,
      project: { id: input.projectId, tenantId: input.tenantId },
    },
    include: { lineItems: true },
  });
  if (!source) return { error: "Orçamento não encontrado" };

  await prisma.budget.update({
    where: { id: source.id },
    data: { status: "SUBSTITUIDO" },
  });

  const newBudget = await prisma.budget.create({
    data: {
      projectId: input.projectId,
      version: source.version + 1,
      status: "RASCUNHO",
      subtotal: source.subtotal,
      bdiPercent: source.bdiPercent,
      total: source.total,
      notes: source.notes,
      lineItems: {
        create: source.lineItems.map((li) => ({
          description: li.description,
          unit: li.unit,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          total: li.total,
          sortOrder: li.sortOrder,
        })),
      },
    },
    include: { lineItems: true },
  });

  await prisma.project.update({
    where: { id: input.projectId },
    data: { status: "ORCAMENTO" },
  });

  return { budget: mapBudget(newBudget) };
}

export async function upsertTask(input: {
  tenantId: string;
  projectId: string;
  taskId?: string;
  name: string;
  phase?: string;
  status?: string;
  startDate?: string | null;
  endDate?: string | null;
  progressPercent?: number;
  assigneeId?: string | null;
  dependsOnId?: string | null;
  sortOrder?: number;
  plannedLaborCost?: number;
  plannedMaterialCost?: number;
  actualLaborCost?: number;
  actualMaterialCost?: number;
  updatedBy: string;
}): Promise<{ task: TaskView } | { error: string }> {
  const prisma = await getPrisma();
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, tenantId: input.tenantId },
  });
  if (!project) return { error: "Obra não encontrada" };
  if (input.status && !isTaskStatus(input.status)) return { error: "Status inválido" };

  if (input.dependsOnId) {
    const dep = await prisma.projectTask.findFirst({
      where: { id: input.dependsOnId, projectId: input.projectId },
    });
    if (!dep) return { error: "Tarefa dependente não encontrada" };
    if (input.taskId && input.dependsOnId === input.taskId) {
      return { error: "Tarefa não pode depender de si mesma" };
    }
  }

  const data = {
    name: input.name.trim(),
    phase: input.phase ?? "GERAL",
    status: input.status ?? "PENDENTE",
    startDate: input.startDate ? new Date(input.startDate) : null,
    endDate: input.endDate ? new Date(input.endDate) : null,
    progressPercent: input.progressPercent ?? 0,
    plannedLaborCost: input.plannedLaborCost ?? 0,
    plannedMaterialCost: input.plannedMaterialCost ?? 0,
    actualLaborCost: input.actualLaborCost ?? 0,
    actualMaterialCost: input.actualMaterialCost ?? 0,
    assigneeId: input.assigneeId ?? null,
    dependsOnId: input.dependsOnId ?? null,
    sortOrder: input.sortOrder ?? 0,
  };

  let task;
  if (input.taskId) {
    task = await prisma.projectTask.update({
      where: { id: input.taskId },
      data,
      include: {
        assignee: { select: { name: true } },
        dependsOn: { select: { name: true } },
      },
    });
  } else {
    const count = await prisma.projectTask.count({ where: { projectId: input.projectId } });
    task = await prisma.projectTask.create({
      data: { ...data, projectId: input.projectId, sortOrder: input.sortOrder ?? count },
      include: {
        assignee: { select: { name: true } },
        dependsOn: { select: { name: true } },
      },
    });
  }

  await syncProjectProgress(input.projectId);

  if (project.status === "APROVADO" && data.status === "EM_ANDAMENTO") {
    await prisma.project.update({
      where: { id: input.projectId },
      data: { status: "EM_OBRA" },
    });
  }

  return { task: mapTask(task) };
}

export async function deleteTask(input: {
  tenantId: string;
  projectId: string;
  taskId: string;
}): Promise<{ ok: true } | { error: string }> {
  const prisma = await getPrisma();
  const task = await prisma.projectTask.findFirst({
    where: { id: input.taskId, projectId: input.projectId, project: { tenantId: input.tenantId } },
  });
  if (!task) return { error: "Tarefa não encontrada" };
  await prisma.projectTask.delete({ where: { id: input.taskId } });
  await syncProjectProgress(input.projectId);
  return { ok: true };
}

export async function uploadAttachment(input: {
  tenantId: string;
  entityType: AttachmentEntityType;
  entityId: string;
  fileName: string;
  contentType: string;
  buffer: Buffer;
  category?: string;
  uploadedById: string;
}): Promise<{ attachment: AttachmentView } | { error: string }> {
  const prisma = await getPrisma();
  if (!isAttachmentEntityType(input.entityType)) return { error: "Tipo de entidade inválido" };
  const category = input.category ?? "OUTRO";
  if (!isAttachmentCategory(category)) return { error: "Categoria inválida" };

  if (input.entityType === "Project") {
    const project = await prisma.project.findFirst({
      where: { id: input.entityId, tenantId: input.tenantId },
    });
    if (!project) return { error: "Obra não encontrada" };
  } else if (input.entityType === "Budget") {
    const budget = await prisma.budget.findFirst({
      where: { id: input.entityId, project: { tenantId: input.tenantId } },
    });
    if (!budget) return { error: "Orçamento não encontrado" };
  } else {
    const report = await prisma.dailyFieldReport.findFirst({
      where: { id: input.entityId, tenantId: input.tenantId },
    });
    if (!report) return { error: "Registro de campo não encontrado" };
  }

  const attachment = await prisma.attachment.create({
    data: {
      tenantId: input.tenantId,
      entityType: input.entityType,
      entityId: input.entityId,
      fileName: input.fileName,
      contentType: input.contentType,
      blobKey: "pending",
      category,
      sizeBytes: input.buffer.length,
      uploadedById: input.uploadedById,
    },
  });

  const blobKey = buildAttachmentBlobKey(
    input.tenantId,
    input.entityType,
    input.entityId,
    attachment.id,
  );

  try {
    await saveAttachmentFile(blobKey, input.buffer, input.contentType);
  } catch (err) {
    await prisma.attachment.delete({ where: { id: attachment.id } });
    return { error: err instanceof Error ? err.message : "Erro ao salvar arquivo" };
  }

  const saved = await prisma.attachment.update({
    where: { id: attachment.id },
    data: { blobKey },
    include: { uploadedBy: { select: { name: true } } },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.ATTACHMENT,
    entityId: saved.id,
    action: TIMELINE_ACTIONS.CREATED,
    description: `Anexo ${input.fileName} (${attachmentCategoryLabel(category)})`,
    createdBy: input.uploadedById,
  });

  return { attachment: mapAttachment(saved) };
}

export async function getAttachmentForDownload(
  tenantId: string,
  attachmentId: string,
): Promise<{ fileName: string; contentType: string; buffer: Buffer } | { error: string }> {
  const prisma = await getPrisma();
  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId, tenantId },
  });
  if (!attachment) return { error: "Anexo não encontrado" };

  const file = await readAttachmentFile(attachment.blobKey);
  if (!file) return { error: "Arquivo não encontrado no storage" };

  return {
    fileName: attachment.fileName,
    contentType: attachment.contentType,
    buffer: file.buffer,
  };
}

export async function deleteAttachment(input: {
  tenantId: string;
  attachmentId: string;
  deletedBy: string;
}): Promise<{ ok: true } | { error: string }> {
  const prisma = await getPrisma();
  const attachment = await prisma.attachment.findFirst({
    where: { id: input.attachmentId, tenantId: input.tenantId },
  });
  if (!attachment) return { error: "Anexo não encontrado" };

  await prisma.attachment.delete({ where: { id: attachment.id } });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.ATTACHMENT,
    entityId: attachment.id,
    action: TIMELINE_ACTIONS.DELETED,
    description: `Anexo ${attachment.fileName} removido`,
    createdBy: input.deletedBy,
  });

  return { ok: true };
}

export async function listProjectPipeline(tenantId: string) {
  const projects = await listProjects(tenantId);
  const statuses = ["ORCAMENTO", "PROPOSTA", "APROVADO", "EM_OBRA", "PARALISADO", "CONCLUIDO"];
  const pipeline: Record<string, ProjectListItem[]> = {};
  for (const status of statuses) {
    pipeline[status] = projects.filter((p) => p.status === status);
  }
  return { pipeline, statuses };
}

export type PjProjectListItem = {
  id: string;
  code: string;
  name: string;
  status: string;
  statusLabel: string;
  progressPercent: number;
  budgetTotal: number | null;
  budgetStatus: string | null;
  budgetId: string | null;
  sentAt: string | null;
};

export async function listProjectsForCompany(
  tenantId: string,
  companyId: string,
): Promise<PjProjectListItem[]> {
  const prisma = await getPrisma();
  const projects = await prisma.project.findMany({
    where: { tenantId, companyId },
    include: {
      budgets: { orderBy: { version: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return projects.map((p) => {
    const b = p.budgets[0];
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      status: p.status,
      statusLabel: projectStatusLabel(p.status),
      progressPercent: p.progressPercent,
      budgetTotal: b?.total ?? null,
      budgetStatus: b?.status ?? null,
      budgetId: b?.id ?? null,
      sentAt: b?.sentAt ? b.sentAt.toISOString() : null,
    };
  });
}

export async function getProjectForCompany(
  tenantId: string,
  companyId: string,
  projectId: string,
): Promise<ProjectDetail | null> {
  const prisma = await getPrisma();
  const owned = await prisma.project.findFirst({
    where: { id: projectId, tenantId, companyId },
  });
  if (!owned) return null;
  const detail = await getProjectDetail(tenantId, projectId);
  if (!detail) return null;
  return {
    ...detail,
    attachments: detail.attachments.map((a) => ({
      ...a,
      downloadUrl: `/api/pj/attachments/${a.id}/download`,
    })),
  };
}

export async function canCompanyAccessAttachment(
  tenantId: string,
  companyId: string,
  attachmentId: string,
): Promise<boolean> {
  const prisma = await getPrisma();
  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId, tenantId },
  });
  if (!attachment) return false;

  if (attachment.entityType === "Project") {
    const project = await prisma.project.findFirst({
      where: { id: attachment.entityId, tenantId, companyId },
    });
    return Boolean(project);
  }

  const budget = await prisma.budget.findFirst({
    where: {
      id: attachment.entityId,
      project: { tenantId, companyId },
    },
  });
  return Boolean(budget);
}

export async function getBudgetPdfData(
  tenantId: string,
  projectId: string,
  budgetId: string,
) {
  const project = await getProjectDetail(tenantId, projectId);
  if (!project) return null;
  const budget = project.budgets.find((b) => b.id === budgetId);
  if (!budget) return null;

  const prisma = await getPrisma();
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { branding: true },
  });
  if (!tenant) return null;

  return {
    tenantName: tenant.branding?.displayName ?? tenant.name,
    platformLabel: tenant.branding?.platformLabel ?? "Powered by Sistema Bibi - ServiceOS",
    project: {
      code: project.code,
      name: project.name,
      companyName: project.companyName,
      addressCity: project.addressCity,
      addressState: project.addressState,
    },
    budget,
  };
}
