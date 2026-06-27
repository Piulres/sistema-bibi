import "server-only";
import { getPrisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import {
  fieldReportStatusLabel,
  fieldTradeLabel,
  isFieldReportStatus,
  isFieldTrade,
  projectStatusLabel,
} from "@/lib/project/constants";
import { uploadAttachment } from "@/lib/project/project-service";
import { providerProjectAccessFilter } from "@/lib/project/provider-access";
import { resolveInvoicePatientForCompany } from "@/lib/project/company-patient";
import { mirrorProjectCashEntry } from "@/lib/project/cash-service";
import { recordTimelineEvent, TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline";
import { dispatchWebhooks } from "@/lib/webhook-service";

export type ProviderProjectItem = {
  id: string;
  code: string;
  name: string;
  status: string;
  statusLabel: string;
  progressPercent: number;
  addressCity: string | null;
  addressState: string | null;
  billingMode: string;
  activeTaskId: string | null;
  activeTaskName: string | null;
  /** Diária sugerida da alocação ativa do prestador nesta obra. */
  dailyRate: number | null;
};

export type FieldReportView = {
  id: string;
  reportDate: string;
  trade: string;
  tradeLabel: string;
  locationNote: string | null;
  latitude: number | null;
  longitude: number | null;
  workDone: string;
  pendingWork: string | null;
  progressPercent: number | null;
  diariaAmount: number | null;
  status: string;
  statusLabel: string;
  invoiceId: string | null;
  projectId: string;
  projectCode: string;
  projectName: string;
  taskId: string | null;
  taskName: string | null;
  authorName: string;
  createdAt: string;
  attachments: {
    id: string;
    fileName: string;
    downloadUrl: string;
    sizeBytes: number;
  }[];
};

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function mapReport(
  r: {
    id: string;
    reportDate: Date;
    trade: string;
    locationNote: string | null;
    latitude: number | null;
    longitude: number | null;
    workDone: string;
    pendingWork: string | null;
    progressPercent: number | null;
    diariaAmount: number | null;
    status: string;
    invoiceId: string | null;
    projectId: string;
    taskId: string | null;
    createdAt: Date;
    project: { code: string; name: string };
    task: { name: string } | null;
    author: { name: string };
  },
  attachments: FieldReportView["attachments"],
  downloadPrefix: string,
): FieldReportView {
  return {
    id: r.id,
    reportDate: iso(r.reportDate)!,
    trade: r.trade,
    tradeLabel: fieldTradeLabel(r.trade),
    locationNote: r.locationNote,
    latitude: r.latitude,
    longitude: r.longitude,
    workDone: r.workDone,
    pendingWork: r.pendingWork,
    progressPercent: r.progressPercent,
    diariaAmount: r.diariaAmount,
    status: r.status,
    statusLabel: fieldReportStatusLabel(r.status),
    invoiceId: r.invoiceId,
    projectId: r.projectId,
    projectCode: r.project.code,
    projectName: r.project.name,
    taskId: r.taskId,
    taskName: r.task?.name ?? null,
    authorName: r.author.name,
    createdAt: r.createdAt.toISOString(),
    attachments: attachments.map((a) => ({
      ...a,
      downloadUrl: `${downloadPrefix}/${a.id}/download`,
    })),
  };
}

async function loadReportAttachments(tenantId: string, reportIds: string[]) {
  if (reportIds.length === 0) return new Map<string, FieldReportView["attachments"]>();
  const prisma = await getPrisma();
  const rows = await prisma.attachment.findMany({
    where: {
      tenantId,
      entityType: "DailyFieldReport",
      entityId: { in: reportIds },
    },
    orderBy: { createdAt: "asc" },
  });
  const map = new Map<string, FieldReportView["attachments"]>();
  for (const row of rows) {
    const list = map.get(row.entityId) ?? [];
    list.push({
      id: row.id,
      fileName: row.fileName,
      downloadUrl: "",
      sizeBytes: row.sizeBytes,
    });
    map.set(row.entityId, list);
  }
  return map;
}

/** Obras em que o prestador é responsável por tarefa ou gerente. */
export async function listProjectsForProvider(
  tenantId: string,
  providerId: string,
): Promise<ProviderProjectItem[]> {
  const prisma = await getPrisma();
  const projects = await prisma.project.findMany({
    where: providerProjectAccessFilter(tenantId, providerId),
    include: {
      tasks: {
        where: {
          OR: [{ assigneeId: providerId }, { status: "EM_ANDAMENTO" }],
        },
        orderBy: [{ status: "desc" }, { sortOrder: "asc" }],
      },
      allocations: {
        where: { providerId, status: "ATIVO" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return projects.map((p) => {
    const task =
      p.tasks.find((t) => t.assigneeId === providerId && t.status === "EM_ANDAMENTO") ??
      p.tasks.find((t) => t.assigneeId === providerId) ??
      p.tasks.find((t) => t.status === "EM_ANDAMENTO") ??
      p.tasks[0];
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      status: p.status,
      statusLabel: projectStatusLabel(p.status),
      progressPercent: p.progressPercent,
      addressCity: p.addressCity,
      addressState: p.addressState,
      billingMode: p.billingMode,
      activeTaskId: task?.id ?? null,
      activeTaskName: task?.name ?? null,
      dailyRate: p.allocations[0]?.dailyRate ?? null,
    };
  });
}

export async function listFieldReportsForProject(
  tenantId: string,
  projectId: string,
  downloadPrefix = "/api/interno/field-reports/attachments",
): Promise<FieldReportView[]> {
  const prisma = await getPrisma();
  const reports = await prisma.dailyFieldReport.findMany({
    where: { tenantId, projectId },
    include: {
      project: { select: { code: true, name: true } },
      task: { select: { name: true } },
      author: { select: { name: true } },
    },
    orderBy: [{ reportDate: "desc" }, { createdAt: "desc" }],
  });
  const attMap = await loadReportAttachments(
    tenantId,
    reports.map((r) => r.id),
  );
  return reports.map((r) => mapReport(r, attMap.get(r.id) ?? [], downloadPrefix));
}

export async function listFieldReportsForProvider(
  tenantId: string,
  providerId: string,
): Promise<FieldReportView[]> {
  const prisma = await getPrisma();
  const reports = await prisma.dailyFieldReport.findMany({
    where: { tenantId, authorId: providerId },
    include: {
      project: { select: { code: true, name: true } },
      task: { select: { name: true } },
      author: { select: { name: true } },
    },
    orderBy: [{ reportDate: "desc" }, { createdAt: "desc" }],
    take: 50,
  });
  const attMap = await loadReportAttachments(
    tenantId,
    reports.map((r) => r.id),
  );
  return reports.map((r) =>
    mapReport(r, attMap.get(r.id) ?? [], "/api/prestador/field-reports/attachments"),
  );
}

export async function createFieldReport(input: {
  tenantId: string;
  authorId: string;
  projectId: string;
  taskId?: string | null;
  reportDate: string;
  trade: string;
  locationNote?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  workDone: string;
  pendingWork?: string | null;
  progressPercent?: number | null;
  diariaAmount?: number | null;
  status?: string;
}): Promise<{ report: FieldReportView } | { error: string }> {
  const prisma = await getPrisma();
  if (!isFieldTrade(input.trade)) return { error: "Ofício inválido" };
  const status = input.status ?? "ENVIADO";
  if (!isFieldReportStatus(status)) return { error: "Status inválido" };

  const canAccess = await prisma.project.findFirst({
    where: {
      id: input.projectId,
      ...providerProjectAccessFilter(input.tenantId, input.authorId),
    },
  });
  if (!canAccess) return { error: "Você não está alocado nesta obra" };

  if (input.taskId) {
    const task = await prisma.projectTask.findFirst({
      where: { id: input.taskId, projectId: input.projectId },
    });
    if (!task) return { error: "Tarefa não encontrada" };
  }

  const report = await prisma.dailyFieldReport.create({
    data: {
      tenantId: input.tenantId,
      projectId: input.projectId,
      taskId: input.taskId ?? null,
      authorId: input.authorId,
      reportDate: new Date(input.reportDate),
      trade: input.trade,
      locationNote: input.locationNote?.trim() || null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      workDone: input.workDone.trim(),
      pendingWork: input.pendingWork?.trim() || null,
      progressPercent: input.progressPercent ?? null,
      diariaAmount: input.diariaAmount ?? null,
      status,
    },
    include: {
      project: { select: { code: true, name: true } },
      task: { select: { name: true } },
      author: { select: { name: true } },
    },
  });

  if (input.taskId && input.progressPercent != null) {
    await prisma.projectTask.update({
      where: { id: input.taskId },
      data: { progressPercent: input.progressPercent },
    });
  }

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.PROJECT,
    entityId: input.projectId,
    action: TIMELINE_ACTIONS.UPDATED,
    description: `RDO ${fieldTradeLabel(input.trade)} — ${input.workDone.slice(0, 80)}`,
    createdBy: input.authorId,
  });

  return {
    report: mapReport(report, [], "/api/prestador/field-reports/attachments"),
  };
}

export async function uploadFieldReportPhoto(input: {
  tenantId: string;
  authorId: string;
  reportId: string;
  fileName: string;
  contentType: string;
  buffer: Buffer;
}): Promise<{ attachment: { id: string; fileName: string } } | { error: string }> {
  const prisma = await getPrisma();
  const report = await prisma.dailyFieldReport.findFirst({
    where: { id: input.reportId, tenantId: input.tenantId, authorId: input.authorId },
  });
  if (!report) return { error: "Registro não encontrado" };

  const result = await uploadAttachment({
    tenantId: input.tenantId,
    entityType: "DailyFieldReport",
    entityId: input.reportId,
    fileName: input.fileName,
    contentType: input.contentType,
    buffer: input.buffer,
    category: "FOTO_CAMPO",
    uploadedById: input.authorId,
  });
  if ("error" in result) return result;
  return { attachment: { id: result.attachment.id, fileName: result.attachment.fileName } };
}

export async function approveAndBillFieldReport(input: {
  tenantId: string;
  reportId: string;
  approvedBy: string;
}): Promise<{ report: FieldReportView; invoiceId?: string } | { error: string }> {
  const prisma = await getPrisma();
  const report = await prisma.dailyFieldReport.findFirst({
    where: { id: input.reportId, tenantId: input.tenantId },
    include: {
      project: true,
      author: { select: { name: true } },
      task: { select: { name: true } },
    },
  });
  if (!report) return { error: "RDO não encontrado" };
  if (report.status !== "ENVIADO") return { error: "Somente RDOs enviados podem ser aprovados" };

  let invoiceId: string | undefined;

  if (report.diariaAmount && report.diariaAmount > 0) {
    const patient = report.project.companyId
      ? await resolveInvoicePatientForCompany(
          input.tenantId,
          report.project.companyId,
          "cliente@build.demo",
        )
      : null;
    if (!patient) {
      return { error: "Não há cliente vinculado à empresa para faturar a diária" };
    }

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: input.tenantId,
        patientId: patient.id,
        companyId: report.project.companyId,
        total: report.diariaAmount,
        status: "FECHADA",
        items: {
          create: [
            {
              description: `${report.project.code} — Diária ${fieldTradeLabel(report.trade)} (${report.author.name}) — ${new Date(report.reportDate).toLocaleDateString("pt-BR")}`,
              amount: report.diariaAmount,
            },
          ],
        },
      },
    });
    invoiceId = invoice.id;

    await mirrorProjectCashEntry({
      tenantId: input.tenantId,
      projectId: report.projectId,
      type: "SAIDA",
      category: "MAO_OBRA",
      description: `Diária ${fieldTradeLabel(report.trade)} — ${report.author.name}`,
      amount: report.diariaAmount,
      referenceType: "DailyFieldReport",
      referenceId: report.id,
      entryDate: report.reportDate,
    });

    void dispatchWebhooks({
      tenantId: input.tenantId,
      event: "INVOICE_ISSUED",
      data: {
        invoiceId: invoice.id,
        patientId: patient.id,
        companyId: report.project.companyId,
        total: invoice.total,
        status: invoice.status,
        projectId: report.projectId,
        fieldReportId: report.id,
        billingType: "DIARIA",
      },
    });
  }

  const updated = await prisma.dailyFieldReport.update({
    where: { id: report.id },
    data: {
      status: invoiceId ? "FATURADO" : "APROVADO",
      invoiceId: invoiceId ?? null,
    },
    include: {
      project: { select: { code: true, name: true } },
      task: { select: { name: true } },
      author: { select: { name: true } },
    },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.PROJECT,
    entityId: report.projectId,
    action: TIMELINE_ACTIONS.UPDATED,
    description: invoiceId
      ? `RDO aprovado e diária faturada — ${formatBRL(report.diariaAmount!)}`
      : "RDO de campo aprovado",
    createdBy: input.approvedBy,
  });

  const attMap = await loadReportAttachments(input.tenantId, [report.id]);

  return {
    report: mapReport(
      updated,
      attMap.get(report.id) ?? [],
      "/api/interno/field-reports/attachments",
    ),
    invoiceId,
  };
}

export async function canAccessFieldReportAttachment(
  tenantId: string,
  attachmentId: string,
  opts:
    | { role: "PRESTADOR"; userId: string }
    | { role: "INTERNO" }
    | { role: "BENEFICIARIO"; patientId: string },
): Promise<boolean> {
  const prisma = await getPrisma();
  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId, tenantId, entityType: "DailyFieldReport" },
  });
  if (!attachment) return false;
  if (opts.role === "INTERNO") return true;

  const report = await prisma.dailyFieldReport.findFirst({
    where: { id: attachment.entityId, tenantId },
    include: { project: { select: { companyId: true } } },
  });
  if (!report) return false;

  if (opts.role === "PRESTADOR") {
    return report.authorId === opts.userId;
  }

  if (!report.project.companyId) return false;
  const patient = await prisma.patient.findFirst({
    where: { id: opts.patientId, tenantId, companyId: report.project.companyId },
  });
  return Boolean(patient);
}
