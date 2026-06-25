import "server-only";
import { getPrisma } from "@/lib/db";
import {
  type AllergyEntry,
  type ChronicConditionEntry,
  parseJsonArray,
} from "@/lib/clinical/constants";

export type PetClinicalProfileView = {
  petId: string;
  allergies: AllergyEntry[];
  chronicConditions: ChronicConditionEntry[];
  updatedAt: string;
};

export async function getPetClinicalProfile(
  petId: string,
  tenantId: string,
): Promise<PetClinicalProfileView | null> {
  const prisma = await getPrisma();
  const pet = await prisma.pet.findFirst({
    where: { id: petId, tenantId },
    select: { id: true },
  });
  if (!pet) return null;

  const profile = await prisma.petClinicalProfile.findUnique({
    where: { petId },
  });

  if (!profile) {
    return {
      petId,
      allergies: [],
      chronicConditions: [],
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    petId,
    allergies: parseJsonArray<AllergyEntry>(profile.allergies),
    chronicConditions: parseJsonArray<ChronicConditionEntry>(profile.chronicConditions),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export async function upsertPetClinicalProfile(
  petId: string,
  tenantId: string,
  input: {
    allergies?: AllergyEntry[];
    chronicConditions?: ChronicConditionEntry[];
  },
): Promise<PetClinicalProfileView> {
  const prisma = await getPrisma();
  const pet = await prisma.pet.findFirst({
    where: { id: petId, tenantId },
  });
  if (!pet) throw new Error("Pet não encontrado");

  const profile = await prisma.petClinicalProfile.upsert({
    where: { petId },
    create: {
      petId,
      allergies: JSON.stringify(input.allergies ?? []),
      chronicConditions: JSON.stringify(input.chronicConditions ?? []),
    },
    update: {
      allergies: input.allergies !== undefined ? JSON.stringify(input.allergies) : undefined,
      chronicConditions:
        input.chronicConditions !== undefined
          ? JSON.stringify(input.chronicConditions)
          : undefined,
    },
  });

  return {
    petId,
    allergies: parseJsonArray<AllergyEntry>(profile.allergies),
    chronicConditions: parseJsonArray<ChronicConditionEntry>(profile.chronicConditions),
    updatedAt: profile.updatedAt.toISOString(),
  };
}
