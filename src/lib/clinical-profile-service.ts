import "server-only";
import { getPrisma } from "@/lib/db";
import {
  type AllergyEntry,
  type ChronicConditionEntry,
  parseJsonArray,
} from "@/lib/clinical/constants";

export type ClinicalProfileView = {
  patientId: string;
  allergies: AllergyEntry[];
  chronicConditions: ChronicConditionEntry[];
  bloodType: string | null;
  updatedAt: string;
};

export async function getClinicalProfile(
  patientId: string,
  tenantId: string,
): Promise<ClinicalProfileView | null> {
  const prisma = await getPrisma();
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, tenantId },
    select: { id: true },
  });
  if (!patient) return null;

  const profile = await prisma.patientClinicalProfile.findUnique({
    where: { patientId },
  });

  if (!profile) {
    return {
      patientId,
      allergies: [],
      chronicConditions: [],
      bloodType: null,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    patientId,
    allergies: parseJsonArray<AllergyEntry>(profile.allergies),
    chronicConditions: parseJsonArray<ChronicConditionEntry>(profile.chronicConditions),
    bloodType: profile.bloodType,
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export async function upsertClinicalProfile(
  patientId: string,
  tenantId: string,
  input: {
    allergies?: AllergyEntry[];
    chronicConditions?: ChronicConditionEntry[];
    bloodType?: string | null;
  },
): Promise<ClinicalProfileView> {
  const prisma = await getPrisma();
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, tenantId },
  });
  if (!patient) throw new Error("Paciente não encontrado");

  const profile = await prisma.patientClinicalProfile.upsert({
    where: { patientId },
    create: {
      patientId,
      allergies: JSON.stringify(input.allergies ?? []),
      chronicConditions: JSON.stringify(input.chronicConditions ?? []),
      bloodType: input.bloodType?.trim() || null,
    },
    update: {
      allergies: input.allergies !== undefined ? JSON.stringify(input.allergies) : undefined,
      chronicConditions:
        input.chronicConditions !== undefined
          ? JSON.stringify(input.chronicConditions)
          : undefined,
      bloodType: input.bloodType !== undefined ? input.bloodType?.trim() || null : undefined,
    },
  });

  return {
    patientId,
    allergies: parseJsonArray<AllergyEntry>(profile.allergies),
    chronicConditions: parseJsonArray<ChronicConditionEntry>(profile.chronicConditions),
    bloodType: profile.bloodType,
    updatedAt: profile.updatedAt.toISOString(),
  };
}
