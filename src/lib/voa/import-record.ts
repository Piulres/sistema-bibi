import "server-only";
import { getPrisma } from "@/lib/db";
import { isPepRecordType, type PepRecordType } from "@/lib/pep-templates";
import {
  recordTimelineEvent,
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "@/lib/timeline";
import { inferRecordTypeFromVoaTemplate } from "@/lib/voa/constants";

export type ImportVoaDocumentInput = {
  tenantId: string;
  providerId: string;
  appointmentId: string;
  patientId: string;
  document: string;
  templateName?: string | null;
  templateSlug?: string | null;
  recordType?: string | null;
  structuredOutput?: Record<string, unknown> | null;
};

function appendStructuredAppendix(
  content: string,
  structured: Record<string, unknown> | null | undefined,
): string {
  if (!structured || Object.keys(structured).length === 0) return content;
  return `${content}\n\n---\n**Dados estruturados (Voa)**\n\`\`\`json\n${JSON.stringify(structured, null, 2)}\n\`\`\``;
}

export async function importVoaDocumentToPep(input: ImportVoaDocumentInput) {
  const prisma = await getPrisma();

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: input.appointmentId,
      patientId: input.patientId,
      providerId: input.providerId,
      tenantId: input.tenantId,
    },
    include: { patient: true },
  });

  if (!appointment) {
    return { error: "Atendimento não encontrado" as const };
  }

  const inferred = input.recordType ?? inferRecordTypeFromVoaTemplate(input.templateSlug);
  const recordType: PepRecordType = isPepRecordType(inferred) ? inferred : "ANAMNESE";

  const title =
    input.templateName?.trim() ||
    (recordType === "ANAMNESE" ? "Anamnese (Voa Health)" : "Documento clínico (Voa Health)");

  const content = appendStructuredAppendix(input.document.trim(), input.structuredOutput);

  const record = await prisma.medicalRecord.create({
    data: {
      patientId: input.patientId,
      appointmentId: input.appointmentId,
      providerId: input.providerId,
      recordType,
      title,
      content,
    },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.MEDICAL_RECORD,
    entityId: record.id,
    action: TIMELINE_ACTIONS.VOA_DOCUMENT_IMPORTED,
    description: `Documento importado da Voa Health para ${appointment.patient.name} (${title})`,
    createdBy: input.providerId,
  });

  return {
    record: {
      id: record.id,
      recordType: record.recordType,
      title: record.title,
      content: record.content,
      createdAt: record.createdAt.toISOString(),
    },
  };
}
