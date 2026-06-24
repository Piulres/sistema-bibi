import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { updatePet } from "@/lib/pet-service";
import { getPrisma } from "@/lib/db";
import { requiresPet } from "@/lib/vet-niche";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireInternoModule("cadastros");
    const { id } = await params;
    const prisma = await getPrisma();
    const tenant = await prisma.tenant.findFirst({
      where: { id: user.tenantId },
      select: { niche: true },
    });
    if (!requiresPet(tenant?.niche)) {
      return NextResponse.json({ error: "Operação não disponível neste segmento" }, { status: 400 });
    }

    const body = (await request.json()) as {
      name?: string;
      species?: string;
      breed?: string | null;
      sex?: string | null;
      birthDate?: string | null;
      size?: string | null;
      weightKg?: number | null;
      microchip?: string | null;
      status?: string;
      notes?: string | null;
    };

    const result = await updatePet({
      tenantId: user.tenantId,
      petId: id,
      name: body.name,
      species: body.species,
      breed: body.breed,
      sex: body.sex,
      birthDate: body.birthDate === undefined ? undefined : body.birthDate ? new Date(body.birthDate) : null,
      size: body.size,
      weightKg: body.weightKg,
      microchip: body.microchip,
      status: body.status,
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
