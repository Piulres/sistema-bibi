import "server-only";
import { createPatient, updatePatient, type PatientExtraFields } from "@/lib/patient-service";
import { assertCompanyPatient } from "@/lib/pj-appointment-service";

export type PjBeneficiaryInput = {
  name: string;
  cpf: string;
  birthDate: Date;
  phone?: string | null;
} & PatientExtraFields;

/** RH inclui colaborador vinculado à própria empresa (anti-IDOR via companyId fixo). */
export async function createPjBeneficiary(input: {
  tenantId: string;
  companyId: string;
  createdBy: string;
  data: PjBeneficiaryInput;
}) {
  return createPatient({
    tenantId: input.tenantId,
    companyId: input.companyId,
    createdBy: input.createdBy,
    name: input.data.name,
    cpf: input.data.cpf,
    birthDate: input.data.birthDate,
    phone: input.data.phone,
    email: input.data.email,
    gender: input.data.gender,
    motherName: input.data.motherName,
    employeeId: input.data.employeeId,
    bondType: input.data.bondType,
  });
}

/** Atualiza dados do colaborador da empresa — bloqueia troca de companyId. */
export async function updatePjBeneficiary(input: {
  tenantId: string;
  companyId: string;
  patientId: string;
  createdBy: string;
  data: Partial<PjBeneficiaryInput>;
}) {
  const ownership = await assertCompanyPatient({
    tenantId: input.tenantId,
    companyId: input.companyId,
    patientId: input.patientId,
  });
  if ("error" in ownership) return ownership;

  const result = await updatePatient({
    tenantId: input.tenantId,
    patientId: input.patientId,
    createdBy: input.createdBy,
    name: input.data.name,
    cpf: input.data.cpf,
    birthDate: input.data.birthDate,
    phone: input.data.phone,
    email: input.data.email,
    gender: input.data.gender,
    motherName: input.data.motherName,
    employeeId: input.data.employeeId,
    bondType: input.data.bondType,
  });

  if (!result) return { error: "Beneficiário não encontrado na empresa" as const };
  if ("error" in result) return result;

  return result;
}

/** Remove vínculo corporativo (sem excluir o registro clínico). */
export async function detachPjBeneficiary(input: {
  tenantId: string;
  companyId: string;
  patientId: string;
  createdBy: string;
}) {
  const ownership = await assertCompanyPatient({
    tenantId: input.tenantId,
    companyId: input.companyId,
    patientId: input.patientId,
  });
  if ("error" in ownership) return ownership;

  const result = await updatePatient({
    tenantId: input.tenantId,
    patientId: input.patientId,
    companyId: null,
    createdBy: input.createdBy,
  });

  if (!result) return { error: "Beneficiário não encontrado na empresa" as const };
  if ("error" in result) return result;

  return result;
}
