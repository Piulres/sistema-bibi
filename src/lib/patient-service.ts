import "server-only";
import { prisma } from "@/lib/db";
import { recordTimelineEvent, TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline";
import { dispatchWebhooks } from "@/lib/webhook-service";

const dateOnly = (value: Date) =>
  value.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export type PatientListView = {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  birthDateLabel: string;
  phone: string | null;
  companyId: string | null;
  companyName: string | null;
};

function mapPatient(p: {
  id: string;
  name: string;
  cpf: string;
  birthDate: Date;
  phone: string | null;
  companyId: string | null;
  company: { name: string } | null;
}): PatientListView {
  return {
    id: p.id,
    name: p.name,
    cpf: p.cpf,
    birthDate: p.birthDate.toISOString().slice(0, 10),
    birthDateLabel: dateOnly(p.birthDate),
    phone: p.phone,
    companyId: p.companyId,
    companyName: p.company?.name ?? null,
  };
}

export async function listPatients(tenantId: string): Promise<PatientListView[]> {
  const rows = await prisma.patient.findMany({
    where: { tenantId },
    include: { company: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  return rows.map(mapPatient);
}

export async function createPatient(input: {
  tenantId: string;
  name: string;
  cpf: string;
  birthDate: Date;
  phone?: string | null;
  companyId?: string | null;
  createdBy: string;
}) {
  const cpf = input.cpf.replace(/\D/g, "");
  const existing = await prisma.patient.findUnique({ where: { cpf } });
  if (existing) return { error: "CPF já cadastrado" as const };

  if (input.companyId) {
    const company = await prisma.company.findFirst({
      where: { id: input.companyId, tenantId: input.tenantId },
    });
    if (!company) return { error: "Empresa não encontrada" as const };
  }

  const patient = await prisma.patient.create({
    data: {
      tenantId: input.tenantId,
      name: input.name.trim(),
      cpf,
      birthDate: input.birthDate,
      phone: input.phone?.trim() || null,
      companyId: input.companyId ?? null,
      consentAt: new Date(),
      consentVersion: "v1-poc",
    },
    include: { company: { select: { name: true } } },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.PATIENT,
    entityId: patient.id,
    action: TIMELINE_ACTIONS.CREATED,
    description: `Beneficiário ${patient.name} cadastrado`,
    createdBy: input.createdBy,
  });

  void dispatchWebhooks({
    tenantId: input.tenantId,
    event: "PATIENT_CREATED",
    data: {
      patientId: patient.id,
      name: patient.name,
      cpf: patient.cpf,
      companyId: patient.companyId,
    },
  });

  return { patient: mapPatient(patient) };
}

export async function updatePatient(input: {
  tenantId: string;
  patientId: string;
  name?: string;
  cpf?: string;
  birthDate?: Date;
  phone?: string | null;
  companyId?: string | null;
  createdBy: string;
}) {
  const existing = await prisma.patient.findFirst({
    where: { id: input.patientId, tenantId: input.tenantId },
  });
  if (!existing) return null;

  if (input.cpf) {
    const cpf = input.cpf.replace(/\D/g, "");
    const dup = await prisma.patient.findFirst({
      where: { cpf, NOT: { id: existing.id } },
    });
    if (dup) return { error: "CPF já cadastrado" as const };
  }

  if (input.companyId) {
    const company = await prisma.company.findFirst({
      where: { id: input.companyId, tenantId: input.tenantId },
    });
    if (!company) return { error: "Empresa não encontrada" as const };
  }

  const patient = await prisma.patient.update({
    where: { id: existing.id },
    data: {
      name: input.name?.trim(),
      cpf: input.cpf ? input.cpf.replace(/\D/g, "") : undefined,
      birthDate: input.birthDate,
      phone: input.phone === undefined ? undefined : input.phone?.trim() || null,
      companyId: input.companyId === undefined ? undefined : input.companyId,
    },
    include: { company: { select: { name: true } } },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.PATIENT,
    entityId: patient.id,
    action: TIMELINE_ACTIONS.UPDATED,
    description: `Beneficiário ${patient.name} atualizado`,
    createdBy: input.createdBy,
  });

  return { patient: mapPatient(patient) };
}
