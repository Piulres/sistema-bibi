import "server-only";
import { getPrisma } from "@/lib/db";
import { recordTimelineEvent, TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline";
import {
  isPetSex,
  isPetSize,
  isPetSpecies,
  isPetStatus,
  PET_SPECIES_LABELS,
  PET_SIZE_LABELS,
} from "@/lib/pet-constants";

const dateOnly = (value: Date) =>
  value.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export type PetListView = {
  id: string;
  name: string;
  species: string;
  speciesLabel: string;
  breed: string | null;
  sex: string | null;
  birthDate: string | null;
  birthDateLabel: string | null;
  size: string | null;
  sizeLabel: string | null;
  weightKg: number | null;
  microchip: string | null;
  status: string;
  notes: string | null;
  patientId: string;
  tutorName: string;
  tutorCpf: string;
  companyName: string | null;
};

function mapPet(p: {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string | null;
  birthDate: Date | null;
  size: string | null;
  weightKg: number | null;
  microchip: string | null;
  status: string;
  notes: string | null;
  patientId: string;
  patient: { name: string; cpf: string; company: { name: string } | null };
}): PetListView {
  return {
    id: p.id,
    name: p.name,
    species: p.species,
    speciesLabel: PET_SPECIES_LABELS[p.species as keyof typeof PET_SPECIES_LABELS] ?? p.species,
    breed: p.breed,
    sex: p.sex,
    birthDate: p.birthDate?.toISOString().slice(0, 10) ?? null,
    birthDateLabel: p.birthDate ? dateOnly(p.birthDate) : null,
    size: p.size,
    sizeLabel: p.size ? (PET_SIZE_LABELS[p.size as keyof typeof PET_SIZE_LABELS] ?? p.size) : null,
    weightKg: p.weightKg,
    microchip: p.microchip,
    status: p.status,
    notes: p.notes,
    patientId: p.patientId,
    tutorName: p.patient.name,
    tutorCpf: p.patient.cpf,
    companyName: p.patient.company?.name ?? null,
  };
}

const petInclude = {
  patient: {
    select: {
      name: true,
      cpf: true,
      company: { select: { name: true } },
    },
  },
} as const;

export async function listPets(
  tenantId: string,
  filters?: { patientId?: string; q?: string },
): Promise<PetListView[]> {
  const prisma = await getPrisma();
  const q = filters?.q?.trim();

  const rows = await prisma.pet.findMany({
    where: {
      tenantId,
      ...(filters?.patientId ? { patientId: filters.patientId } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { breed: { contains: q } },
              { patient: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    include: petInclude,
    orderBy: [{ patient: { name: "asc" } }, { name: "asc" }],
  });

  return rows.map(mapPet);
}

export async function getPetById(tenantId: string, petId: string): Promise<PetListView | null> {
  const prisma = await getPrisma();
  const row = await prisma.pet.findFirst({
    where: { id: petId, tenantId },
    include: petInclude,
  });
  return row ? mapPet(row) : null;
}

export async function createPet(input: {
  tenantId: string;
  patientId: string;
  name: string;
  species: string;
  breed?: string | null;
  sex?: string | null;
  birthDate?: Date | null;
  size?: string | null;
  weightKg?: number | null;
  microchip?: string | null;
  notes?: string | null;
  createdBy: string;
}) {
  const prisma = await getPrisma();
  const name = input.name.trim();
  if (!name) return { error: "Informe o nome do pet" as const };
  if (!isPetSpecies(input.species)) return { error: "Espécie inválida" as const };
  if (input.sex && !isPetSex(input.sex)) return { error: "Sexo inválido" as const };
  if (input.size && !isPetSize(input.size)) return { error: "Porte inválido" as const };

  const tutor = await prisma.patient.findFirst({
    where: { id: input.patientId, tenantId: input.tenantId },
  });
  if (!tutor) return { error: "Tutor não encontrado" as const };

  const pet = await prisma.pet.create({
    data: {
      tenantId: input.tenantId,
      patientId: input.patientId,
      name,
      species: input.species,
      breed: input.breed?.trim() || null,
      sex: input.sex ?? null,
      birthDate: input.birthDate ?? null,
      size: input.size ?? null,
      weightKg: input.weightKg ?? null,
      microchip: input.microchip?.trim() || null,
      notes: input.notes?.trim() || null,
      status: "ATIVO",
    },
    include: petInclude,
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.PATIENT,
    entityId: input.patientId,
    action: TIMELINE_ACTIONS.CREATED,
    description: `Pet cadastrado: ${pet.name} (${PET_SPECIES_LABELS[input.species]}) — tutor ${tutor.name}`,
    createdBy: input.createdBy,
  });

  return { pet: mapPet(pet) };
}

export async function updatePet(input: {
  tenantId: string;
  petId: string;
  name?: string;
  species?: string;
  breed?: string | null;
  sex?: string | null;
  birthDate?: Date | null;
  size?: string | null;
  weightKg?: number | null;
  microchip?: string | null;
  status?: string;
  notes?: string | null;
  createdBy: string;
}) {
  const prisma = await getPrisma();
  const existing = await prisma.pet.findFirst({
    where: { id: input.petId, tenantId: input.tenantId },
  });
  if (!existing) return { error: "Pet não encontrado" as const };

  if (input.species && !isPetSpecies(input.species)) return { error: "Espécie inválida" as const };
  if (input.sex && !isPetSex(input.sex)) return { error: "Sexo inválido" as const };
  if (input.size && !isPetSize(input.size)) return { error: "Porte inválido" as const };
  if (input.status && !isPetStatus(input.status)) return { error: "Status inválido" as const };

  const pet = await prisma.pet.update({
    where: { id: existing.id },
    data: {
      name: input.name?.trim(),
      species: input.species,
      breed: input.breed === undefined ? undefined : input.breed?.trim() || null,
      sex: input.sex,
      birthDate: input.birthDate,
      size: input.size,
      weightKg: input.weightKg,
      microchip: input.microchip === undefined ? undefined : input.microchip?.trim() || null,
      status: input.status,
      notes: input.notes === undefined ? undefined : input.notes?.trim() || null,
    },
    include: petInclude,
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.PATIENT,
    entityId: pet.patientId,
    action: TIMELINE_ACTIONS.UPDATED,
    description: `Cadastro do pet ${pet.name} atualizado`,
    createdBy: input.createdBy,
  });

  return { pet: mapPet(pet) };
}

/** Valida pet pertencente ao tutor no tenant. */
export async function validatePetForAppointment(input: {
  tenantId: string;
  patientId: string;
  petId: string;
}): Promise<{ ok: true } | { error: string }> {
  const prisma = await getPrisma();
  const pet = await prisma.pet.findFirst({
    where: {
      id: input.petId,
      tenantId: input.tenantId,
      patientId: input.patientId,
      status: "ATIVO",
    },
  });
  if (!pet) return { error: "Pet não encontrado ou não pertence ao tutor selecionado" };
  return { ok: true };
}
