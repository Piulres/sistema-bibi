import type { PrismaClient } from "@prisma/client";

type PetClinicalSeedInput = {
  tenantId: string;
  providerId: string;
  pets: Array<{ id: string; name: string; patientId: string }>;
};

/** Massa clínica demo VET — perfis, vacinas, meds e exames por pet. */
export async function seedPetClinicalDemo(
  prisma: PrismaClient,
  input: PetClinicalSeedInput,
): Promise<void> {
  const byName = new Map(input.pets.map((p) => [p.name, p]));
  const thor = byName.get("Thor");
  const luna = byName.get("Luna");
  const bob = byName.get("Bob");
  const mel = byName.get("Mel");

  if (thor) {
    await prisma.petClinicalProfile.upsert({
      where: { petId: thor.id },
      create: {
        petId: thor.id,
        allergies: JSON.stringify([
          { substance: "Penicilina", severity: "Alta", notes: "Reação cutânea documentada" },
        ]),
        chronicConditions: JSON.stringify([
          { condition: "Displasia coxofemoral leve", since: "2023" },
        ]),
      },
      update: {},
    });

    await prisma.petVaccineRecord.createMany({
      data: [
        {
          petId: thor.id,
          providerId: input.providerId,
          vaccineName: "V10 (Polivalente canina)",
          doseLabel: "Reforço anual",
          appliedAt: new Date(Date.now() - 120 * 86_400_000),
          nextDueAt: new Date(Date.now() + 245 * 86_400_000),
          batchNumber: "V10-2025-A",
          status: "APLICADA",
        },
        {
          petId: thor.id,
          providerId: input.providerId,
          vaccineName: "Antirrábica",
          doseLabel: "Anual",
          appliedAt: new Date(Date.now() - 120 * 86_400_000),
          nextDueAt: new Date(Date.now() + 245 * 86_400_000),
          batchNumber: "RA-8842",
          status: "APLICADA",
        },
      ],
    });

    await prisma.medicationPrescription.create({
      data: {
        patientId: thor.patientId,
        petId: thor.id,
        providerId: input.providerId,
        status: "ATIVA",
        medication: "Condroitina + Glucosamina",
        dosage: "1 comprimido",
        frequency: "1x ao dia",
        route: "VO",
        durationDays: 60,
        notes: "Suporte articular — displasia leve",
      },
    });

    await prisma.examOrder.create({
      data: {
        patientId: thor.patientId,
        petId: thor.id,
        providerId: input.providerId,
        examName: "Radiografia quadril (2 incidências)",
        status: "SOLICITADO",
        clinicalIndication: "Acompanhamento displasia coxofemoral",
      },
    });
  }

  if (luna) {
    await prisma.petClinicalProfile.upsert({
      where: { petId: luna.id },
      create: {
        petId: luna.id,
        allergies: JSON.stringify([]),
        chronicConditions: JSON.stringify([
          { condition: "Asma felina leve", since: "2024" },
        ]),
      },
      update: {},
    });

    await prisma.petVaccineRecord.createMany({
      data: [
        {
          petId: luna.id,
          providerId: input.providerId,
          vaccineName: "V4 Felina",
          doseLabel: "1ª dose",
          appliedAt: new Date(Date.now() - 30 * 86_400_000),
          nextDueAt: new Date(Date.now() + 335 * 86_400_000),
          status: "APLICADA",
        },
        {
          petId: luna.id,
          providerId: input.providerId,
          vaccineName: "V4 Felina",
          doseLabel: "Reforço anual",
          nextDueAt: new Date(Date.now() + 14 * 86_400_000),
          status: "PENDENTE",
        },
      ],
    });

    await prisma.medicationPrescription.create({
      data: {
        patientId: luna.patientId,
        petId: luna.id,
        providerId: input.providerId,
        status: "ATIVA",
        medication: "Prednisolona 5mg",
        dosage: "1/2 comprimido",
        frequency: "1x ao dia (crise)",
        route: "VO",
        durationDays: 5,
        notes: "Uso sob orientação em crise respiratória",
      },
    });
  }

  if (bob) {
    await prisma.petVaccineRecord.create({
      data: {
        petId: bob.id,
        providerId: input.providerId,
        vaccineName: "V10 (Polivalente canina)",
        doseLabel: "Reforço anual",
        appliedAt: new Date(Date.now() - 200 * 86_400_000),
        nextDueAt: new Date(Date.now() - 10 * 86_400_000),
        status: "VENCIDA",
      },
    });
  }

  if (mel) {
    await prisma.petClinicalProfile.upsert({
      where: { petId: mel.id },
      create: {
        petId: mel.id,
        allergies: JSON.stringify([
          { substance: "Ivermectina", severity: "Moderada" },
        ]),
        chronicConditions: JSON.stringify([]),
      },
      update: {},
    });

    await prisma.petVaccineRecord.create({
      data: {
        petId: mel.id,
        providerId: input.providerId,
        vaccineName: "V5 Felina",
        doseLabel: "Anual",
        appliedAt: new Date(Date.now() - 60 * 86_400_000),
        nextDueAt: new Date(Date.now() + 305 * 86_400_000),
        status: "APLICADA",
      },
    });
  }
}
