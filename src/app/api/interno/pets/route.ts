import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { createPet, listPets } from "@/lib/pet-service";
import { requiresPet } from "@/lib/vet-niche";
import { getPrisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const user = await requireInternoModule("cadastros");
    const prisma = await getPrisma();
    const tenant = await prisma.tenant.findFirst({
      where: { id: user.tenantId },
      select: { niche: true },
    });
    if (!requiresPet(tenant?.niche)) {
      return NextResponse.json({ pets: [], niche: tenant?.niche ?? "MEDICAL" });
    }

    const url = new URL(request.url);
    const patientId = url.searchParams.get("patientId") ?? undefined;
    const q = url.searchParams.get("q") ?? undefined;

    const pets = await listPets(user.tenantId, { patientId, q });
    return NextResponse.json({ pets, niche: tenant?.niche });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("cadastros");
    const prisma = await getPrisma();
    const tenant = await prisma.tenant.findFirst({
      where: { id: user.tenantId },
      select: { niche: true },
    });
    if (!requiresPet(tenant?.niche)) {
      return NextResponse.json({ error: "Cadastro de pets disponível apenas no segmento veterinário" }, { status: 400 });
    }

    const body = (await request.json()) as {
      patientId?: string;
      name?: string;
      species?: string;
      breed?: string | null;
      sex?: string | null;
      birthDate?: string | null;
      size?: string | null;
      weightKg?: number | null;
      microchip?: string | null;
      notes?: string | null;
    };

    if (!body.patientId || !body.name || !body.species) {
      return NextResponse.json({ error: "Informe tutor, nome e espécie do pet" }, { status: 400 });
    }

    const result = await createPet({
      tenantId: user.tenantId,
      patientId: body.patientId,
      name: body.name,
      species: body.species,
      breed: body.breed,
      sex: body.sex,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      size: body.size,
      weightKg: body.weightKg,
      microchip: body.microchip,
      notes: body.notes,
      createdBy: user.id,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
