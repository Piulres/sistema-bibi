import "server-only";
import { getPrisma } from "@/lib/db";
import { getTenantBranding } from "@/lib/theme/branding";
import { buildPepPdfBuffer, type PepExportContext } from "@/lib/exports/pep-pdf";

const dateOnly = (value: Date) =>
  value.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const dateTime = (value: Date) =>
  value.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Carrega contexto completo de um registro clínico para exportação PEP. */
export async function fetchPepExportContext(
  tenantId: string,
  recordId: string,
  options?: { patientId?: string; providerId?: string },
): Promise<PepExportContext | null> {
  const prisma = await getPrisma();
  const record = await prisma.medicalRecord.findFirst({
    where: {
      id: recordId,
      patient: { tenantId },
      ...(options?.patientId ? { patientId: options.patientId } : {}),
      ...(options?.providerId ? { providerId: options.providerId } : {}),
    },
    include: {
      patient: { include: { company: { select: { name: true } } } },
      provider: {
        select: {
          name: true,
          phone: true,
          councilType: true,
          councilNumber: true,
          councilUf: true,
          specialty: true,
        },
      },
      appointment: { select: { scheduledAt: true } },
    },
  });

  if (!record) return null;

  const branding = await getTenantBranding(tenantId);

  return {
    clinic: {
      displayName: branding.displayName,
      tagline: branding.tagline,
      platformLabel: branding.platformLabel,
    },
    patient: {
      name: record.patient.name,
      cpf: record.patient.cpf,
      birthDateLabel: dateOnly(record.patient.birthDate),
      phone: record.patient.phone,
      companyName: record.patient.company?.name ?? null,
    },
    provider: {
      name: record.provider.name,
      councilType: record.provider.councilType,
      councilNumber: record.provider.councilNumber,
      councilUf: record.provider.councilUf,
      specialty: record.provider.specialty,
      phone: record.provider.phone,
    },
    record: {
      recordType: record.recordType,
      title: record.title,
      content: record.content,
      createdAtLabel: dateTime(record.createdAt),
      appointmentDateLabel: record.appointment
        ? dateTime(record.appointment.scheduledAt)
        : null,
    },
  };
}

/** PDF customizado de um ou mais registros PEP. */
export async function buildPepRecordPdf(
  tenantId: string,
  recordIds: string[],
  options?: { patientId?: string; providerId?: string },
): Promise<Buffer | null> {
  const contexts: PepExportContext[] = [];
  for (const recordId of recordIds) {
    const ctx = await fetchPepExportContext(tenantId, recordId, options);
    if (ctx) contexts.push(ctx);
  }
  if (contexts.length === 0) return null;
  return buildPepPdfBuffer(contexts);
}
