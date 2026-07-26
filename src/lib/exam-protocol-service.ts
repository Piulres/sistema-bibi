import "server-only";
import { getPrisma } from "@/lib/db";
import {
  parseJsonArray,
  type ExamProtocolItem,
} from "@/lib/clinical/constants";
import { createExamOrder, type ExamOrderView } from "@/lib/exam-order-service";

export type { ExamProtocolItem };

export type ExamProtocolTemplateView = {
  id: string;
  name: string;
  specialty: string | null;
  exams: ExamProtocolItem[];
  clinicalIndication: string | null;
  active: boolean;
};

function mapTemplate(row: {
  id: string;
  name: string;
  specialty: string | null;
  exams: string;
  clinicalIndication: string | null;
  active: boolean;
}): ExamProtocolTemplateView {
  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    exams: parseJsonArray<ExamProtocolItem>(row.exams),
    clinicalIndication: row.clinicalIndication,
    active: row.active,
  };
}

export async function listExamProtocolTemplates(
  tenantId: string,
  activeOnly = true,
): Promise<ExamProtocolTemplateView[]> {
  const prisma = await getPrisma();
  const rows = await prisma.examProtocolTemplate.findMany({
    where: { tenantId, ...(activeOnly ? { active: true } : {}) },
    orderBy: { name: "asc" },
  });
  return rows.map(mapTemplate);
}

export async function createExamProtocolTemplate(input: {
  tenantId: string;
  name: string;
  specialty?: string | null;
  exams: ExamProtocolItem[];
  clinicalIndication?: string | null;
}): Promise<ExamProtocolTemplateView> {
  const prisma = await getPrisma();
  const row = await prisma.examProtocolTemplate.create({
    data: {
      tenantId: input.tenantId,
      name: input.name.trim(),
      specialty: input.specialty?.trim() || null,
      exams: JSON.stringify(input.exams),
      clinicalIndication: input.clinicalIndication?.trim() || null,
    },
  });
  return mapTemplate(row);
}

export async function updateExamProtocolTemplate(input: {
  id: string;
  tenantId: string;
  name?: string;
  specialty?: string | null;
  exams?: ExamProtocolItem[];
  clinicalIndication?: string | null;
  active?: boolean;
}): Promise<ExamProtocolTemplateView | null> {
  const prisma = await getPrisma();
  const existing = await prisma.examProtocolTemplate.findFirst({
    where: { id: input.id, tenantId: input.tenantId },
  });
  if (!existing) return null;

  const row = await prisma.examProtocolTemplate.update({
    where: { id: input.id },
    data: {
      name: input.name?.trim(),
      specialty:
        input.specialty !== undefined ? input.specialty?.trim() || null : undefined,
      exams: input.exams !== undefined ? JSON.stringify(input.exams) : undefined,
      clinicalIndication:
        input.clinicalIndication !== undefined
          ? input.clinicalIndication?.trim() || null
          : undefined,
      active: input.active,
    },
  });
  return mapTemplate(row);
}

/** Aplica um protocolo ativo: cria um ExamOrder por item do painel. */
export async function applyExamProtocol(input: {
  templateId: string;
  tenantId: string;
  patientId: string;
  providerId: string;
  appointmentId?: string | null;
  petId?: string | null;
  patientName: string;
  clinicalIndicationOverride?: string | null;
}): Promise<{ template: ExamProtocolTemplateView; examOrders: ExamOrderView[] }> {
  const prisma = await getPrisma();
  const template = await prisma.examProtocolTemplate.findFirst({
    where: { id: input.templateId, tenantId: input.tenantId, active: true },
  });
  if (!template) throw new Error("Protocolo de exames não encontrado ou inativo");

  const view = mapTemplate(template);
  if (view.exams.length === 0) throw new Error("Protocolo sem exames");

  const indication =
    input.clinicalIndicationOverride?.trim() ||
    template.clinicalIndication ||
    `Protocolo: ${template.name}`;

  const examOrders: ExamOrderView[] = [];
  for (const item of view.exams) {
    const order = await createExamOrder({
      patientId: input.patientId,
      tenantId: input.tenantId,
      providerId: input.providerId,
      appointmentId: input.appointmentId,
      petId: input.petId,
      procedureId: item.procedureId ?? null,
      examName: item.examName,
      clinicalIndication: indication,
      patientName: input.patientName,
    });
    examOrders.push(order);
  }

  return { template: view, examOrders };
}
