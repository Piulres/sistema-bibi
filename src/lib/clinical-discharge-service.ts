import "server-only";
import { listPrescriptionDocuments } from "@/lib/prescription-document-service";
import { listPatientExamOrders } from "@/lib/exam-order-service";
import { listClinicalReferrals } from "@/lib/clinical-referral-service";
import { getPrisma } from "@/lib/db";

export type DischargeDocumentKind = "RECEITA" | "PEDIDO_EXAME" | "ENCAMINHAMENTO" | "ATESTADO";

export type DischargeDocumentView = {
  id: string;
  kind: DischargeDocumentKind;
  kindLabel: string;
  title: string;
  summary: string;
  status: string;
  statusLabel: string;
  providerName: string;
  createdAt: string;
  createdAtLabel: string;
  appointmentId: string | null;
  /** Query para GET /clinical-guides/export */
  exportParams: {
    type: "receita" | "exame" | "encaminhamento" | "atestado";
    id: string;
    appointmentId?: string;
  };
};

function kindLabel(kind: DischargeDocumentKind): string {
  switch (kind) {
    case "RECEITA":
      return "Receita";
    case "PEDIDO_EXAME":
      return "Pedido de exames";
    case "ENCAMINHAMENTO":
      return "Encaminhamento";
    case "ATESTADO":
      return "Atestado";
    default:
      return kind;
  }
}

/**
 * Hub unificado de documentos de saída do atendimento.
 * Prestador imprime; beneficiário baixa no painel — padrão de mercado BR.
 */
export async function listDischargeDocuments(
  patientId: string,
  tenantId: string,
  options?: { appointmentId?: string; petId?: string; tutorOnly?: boolean },
): Promise<DischargeDocumentView[]> {
  const [prescriptions, examOrders, referrals, atestados] = await Promise.all([
    listPrescriptionDocuments(patientId, tenantId, {
      appointmentId: options?.appointmentId,
      petId: options?.petId,
    }),
    listPatientExamOrders(patientId, tenantId, {
      appointmentId: options?.appointmentId,
      petId: options?.petId,
      tutorOnly: options?.tutorOnly,
    }),
    listClinicalReferrals(patientId, tenantId, {
      appointmentId: options?.appointmentId,
      petId: options?.petId,
      tutorOnly: options?.tutorOnly,
    }),
    listAtestadoRecords(patientId, tenantId, options),
  ]);

  const docs: DischargeDocumentView[] = [];

  for (const rx of prescriptions) {
    if (rx.status === "CANCELADA") continue;
    docs.push({
      id: rx.id,
      kind: "RECEITA",
      kindLabel: kindLabel("RECEITA"),
      title: rx.title ?? rx.prescriptionKindLabel,
      summary: `${rx.itemCount} medicamento(s) · ${rx.prescriptionKindLabel}`,
      status: rx.status,
      statusLabel: rx.status === "ATIVA" ? "Ativa" : rx.status,
      providerName: rx.providerName,
      createdAt: rx.createdAt,
      createdAtLabel: rx.createdAtLabel,
      appointmentId: rx.appointmentId,
      exportParams: { type: "receita", id: rx.id },
    });
  }

  // Agrupa pedidos de exame por atendimento (ou unitário se avulso).
  const examGroups = new Map<string, typeof examOrders>();
  for (const exam of examOrders) {
    if (exam.status === "CANCELADO") continue;
    const key = exam.appointmentId ?? `solo:${exam.id}`;
    const group = examGroups.get(key) ?? [];
    group.push(exam);
    examGroups.set(key, group);
  }

  for (const [, group] of examGroups) {
    const head = group[0];
    const names = group.map((e) => e.examName).join(", ");
    const id = head.appointmentId ?? head.id;
    docs.push({
      id: `exam-guide:${id}`,
      kind: "PEDIDO_EXAME",
      kindLabel: kindLabel("PEDIDO_EXAME"),
      title:
        group.length === 1
          ? `Pedido — ${head.examName}`
          : `Pedido de exames (${group.length})`,
      summary: names.length > 120 ? `${names.slice(0, 117)}…` : names,
      status: head.status,
      statusLabel: head.statusLabel,
      providerName: head.providerName,
      createdAt: head.createdAt,
      createdAtLabel: head.createdAtLabel,
      appointmentId: head.appointmentId,
      exportParams: head.appointmentId
        ? { type: "exame", id: head.appointmentId, appointmentId: head.appointmentId }
        : { type: "exame", id: head.id },
    });
  }

  for (const ref of referrals) {
    if (ref.status === "CANCELADO") continue;
    docs.push({
      id: ref.id,
      kind: "ENCAMINHAMENTO",
      kindLabel: kindLabel("ENCAMINHAMENTO"),
      title: ref.title,
      summary: `${ref.urgencyLabel} · ${ref.clinicalReason.slice(0, 100)}${
        ref.clinicalReason.length > 100 ? "…" : ""
      }`,
      status: ref.status,
      statusLabel: ref.statusLabel,
      providerName: ref.providerName,
      createdAt: ref.createdAt,
      createdAtLabel: ref.createdAtLabel,
      appointmentId: ref.appointmentId,
      exportParams: { type: "encaminhamento", id: ref.id },
    });
  }

  for (const atestado of atestados) {
    docs.push(atestado);
  }

  docs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return docs;
}

async function listAtestadoRecords(
  patientId: string,
  tenantId: string,
  options?: { appointmentId?: string; petId?: string; tutorOnly?: boolean },
): Promise<DischargeDocumentView[]> {
  const prisma = await getPrisma();
  const rows = await prisma.medicalRecord.findMany({
    where: {
      patientId,
      patient: { tenantId },
      recordType: "ATESTADO",
      ...(options?.appointmentId ? { appointmentId: options.appointmentId } : {}),
      ...(options?.petId ? { petId: options.petId } : {}),
      ...(options?.tutorOnly ? { petId: null } : {}),
    },
    include: { provider: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    kind: "ATESTADO" as const,
    kindLabel: kindLabel("ATESTADO"),
    title: row.title?.trim() || "Atestado médico",
    summary: row.content.slice(0, 120) + (row.content.length > 120 ? "…" : ""),
    status: "EMITIDO",
    statusLabel: "Emitido",
    providerName: row.provider.name,
    createdAt: row.createdAt.toISOString(),
    createdAtLabel: row.createdAt.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    appointmentId: row.appointmentId,
    exportParams: { type: "atestado" as const, id: row.id },
  }));
}
