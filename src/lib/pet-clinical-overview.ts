import "server-only";
import { getPetClinicalProfile } from "@/lib/pet-clinical-profile-service";
import { listPatientMedications } from "@/lib/medication-service";
import { listPatientExamOrders } from "@/lib/exam-order-service";
import { listPetVaccines } from "@/lib/pet-vaccine-service";
import { getPrisma } from "@/lib/db";
import type { PetClinicalProfileView } from "@/lib/pet-clinical-profile-service";
import type { MedicationView } from "@/lib/medication-service";
import type { ExamOrderView } from "@/lib/exam-order-service";
import type { PetVaccineView } from "@/lib/pet-vaccine-service";

export type PetClinicalOverview = {
  petId: string;
  petName: string;
  profile: PetClinicalProfileView;
  activeMedications: MedicationView[];
  pendingExams: ExamOrderView[];
  vaccines: PetVaccineView[];
  upcomingVaccines: PetVaccineView[];
};

/** Visão clínica consolidada do pet (VET). */
export async function getPetClinicalOverview(
  petId: string,
  tenantId: string,
): Promise<PetClinicalOverview | null> {
  const prisma = await getPrisma();
  const pet = await prisma.pet.findFirst({
    where: { id: petId, tenantId },
    select: { id: true, name: true, patientId: true },
  });
  if (!pet) return null;

  const profile = await getPetClinicalProfile(petId, tenantId);
  if (!profile) return null;

  const [medications, examOrders, vaccines] = await Promise.all([
    listPatientMedications(pet.patientId, tenantId, { activeOnly: true, petId }),
    listPatientExamOrders(pet.patientId, tenantId, { petId }),
    listPetVaccines(petId, tenantId),
  ]);

  const pendingExams = examOrders.filter((e) =>
    ["SOLICITADO", "AGENDADO", "REALIZADO"].includes(e.status),
  );

  const now = Date.now();
  const upcomingVaccines = vaccines.filter(
    (v) =>
      v.status === "PENDENTE" ||
      (v.nextDueAt && new Date(v.nextDueAt).getTime() <= now + 30 * 86_400_000),
  );

  return {
    petId: pet.id,
    petName: pet.name,
    profile,
    activeMedications: medications,
    pendingExams,
    vaccines,
    upcomingVaccines,
  };
}
