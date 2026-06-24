import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { listPetVaccines } from "@/lib/pet-vaccine-service";
import { getPrisma } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["BENEFICIARIO"]);
    if (!user.patientId) {
      return NextResponse.json({ error: "Beneficiário sem vínculo" }, { status: 403 });
    }

    const { id: petId } = await params;
    const prisma = await getPrisma();
    const pet = await prisma.pet.findFirst({
      where: { id: petId, tenantId: user.tenantId, patientId: user.patientId },
    });
    if (!pet) {
      return NextResponse.json({ error: "Pet não encontrado" }, { status: 404 });
    }

    const vaccines = await listPetVaccines(petId, user.tenantId);
    return NextResponse.json({ vaccines, pet: { id: pet.id, name: pet.name } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
