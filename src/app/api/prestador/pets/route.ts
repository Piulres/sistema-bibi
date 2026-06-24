import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { PET_SPECIES_LABELS, PET_SIZE_LABELS } from "@/lib/pet-constants";

export async function GET(request: Request) {
  const prisma = await getPrisma();
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";

    const pets = await prisma.pet.findMany({
      where: {
        tenantId: user.tenantId,
        status: "ATIVO",
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { breed: { contains: q } },
                { patient: { name: { contains: q } } },
              ],
            }
          : {}),
        appointments: { some: { providerId: user.id } },
      },
      select: {
        id: true,
        name: true,
        species: true,
        breed: true,
        size: true,
        patient: {
          select: {
            name: true,
            cpf: true,
            company: { select: { name: true } },
          },
        },
        _count: { select: { appointments: true } },
      },
      orderBy: { name: "asc" },
      take: 50,
    });

    return NextResponse.json({
      pets: pets.map((p) => ({
        id: p.id,
        name: p.name,
        species: p.species,
        speciesLabel: PET_SPECIES_LABELS[p.species as keyof typeof PET_SPECIES_LABELS] ?? p.species,
        breed: p.breed,
        sizeLabel: p.size ? (PET_SIZE_LABELS[p.size as keyof typeof PET_SIZE_LABELS] ?? p.size) : null,
        tutorName: p.patient.name,
        tutorCpf: p.patient.cpf,
        company: p.patient.company?.name ?? null,
        appointmentsCount: p._count.appointments,
      })),
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
