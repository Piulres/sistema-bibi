import "server-only";
import { getPrisma } from "@/lib/db";
import { recordTimelineEvent, TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline";
import { dispatchWebhooks } from "@/lib/webhook-service";
import { isValidCpf, normalizeCpf } from "@/lib/validation/br-documents";

export { PATIENT_BOND_TYPES, PATIENT_GENDERS } from "@/lib/cadastro-constants";

const dateOnly = (value: Date) =>
  value.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export type PatientExtraFields = {
  email?: string | null;
  gender?: string | null;
  motherName?: string | null;
  employeeId?: string | null;
  bondType?: string | null;
};

export type PatientListView = {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  birthDateLabel: string;
  phone: string | null;
  email: string | null;
  gender: string | null;
  motherName: string | null;
  employeeId: string | null;
  bondType: string | null;
  companyId: string | null;
  companyName: string | null;
};

function trimOrNull(value: string | null | undefined): string | null {
  const v = value?.trim();
  return v || null;
}

function mapPatient(p: {
  id: string;
  name: string;
  cpf: string;
  birthDate: Date;
  phone: string | null;
  email: string | null;
  gender: string | null;
  motherName: string | null;
  employeeId: string | null;
  bondType: string | null;
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
    email: p.email,
    gender: p.gender,
    motherName: p.motherName,
    employeeId: p.employeeId,
    bondType: p.bondType,
    companyId: p.companyId,
    companyName: p.company?.name ?? null,
  };
}

function patientExtraData(fields: PatientExtraFields) {
  return {
    email: fields.email === undefined ? undefined : trimOrNull(fields.email),
    gender: fields.gender === undefined ? undefined : trimOrNull(fields.gender),
    motherName: fields.motherName === undefined ? undefined : trimOrNull(fields.motherName),
    employeeId: fields.employeeId === undefined ? undefined : trimOrNull(fields.employeeId),
    bondType: fields.bondType === undefined ? undefined : trimOrNull(fields.bondType),
  };
}

export async function listPatients(tenantId: string): Promise<PatientListView[]> {
  const prisma = await getPrisma();
  const rows = await prisma.patient.findMany({
    where: { tenantId },
    include: { company: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  return rows.map(mapPatient);
}

export async function createPatient(
  input: {
    tenantId: string;
    name: string;
    cpf: string;
    birthDate: Date;
    phone?: string | null;
    companyId?: string | null;
    createdBy: string;
  } & PatientExtraFields,
) {
  const prisma = await getPrisma();
  const cpf = normalizeCpf(input.cpf);
  if (!isValidCpf(cpf)) return { error: "CPF inválido" as const };

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
      phone: trimOrNull(input.phone),
      companyId: input.companyId ?? null,
      consentAt: new Date(),
      consentVersion: "v1-poc",
      ...patientExtraData(input),
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

export async function updatePatient(
  input: {
    tenantId: string;
    patientId: string;
    name?: string;
    cpf?: string;
    birthDate?: Date;
    phone?: string | null;
    companyId?: string | null;
    createdBy: string;
  } & PatientExtraFields,
) {
  const prisma = await getPrisma();

  const existing = await prisma.patient.findFirst({
    where: { id: input.patientId, tenantId: input.tenantId },
  });
  if (!existing) return null;

  if (input.cpf) {
    const cpf = normalizeCpf(input.cpf);
    if (!isValidCpf(cpf)) return { error: "CPF inválido" as const };
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
      cpf: input.cpf ? normalizeCpf(input.cpf) : undefined,
      birthDate: input.birthDate,
      phone: input.phone === undefined ? undefined : trimOrNull(input.phone),
      companyId: input.companyId === undefined ? undefined : input.companyId,
      ...patientExtraData(input),
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
