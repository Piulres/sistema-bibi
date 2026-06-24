import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { getPetClinicalOverview } from "@/lib/pet-clinical-overview";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id: petId } = await params;
    const overview = await getPetClinicalOverview(petId, user.tenantId);
    if (!overview) {
      return NextResponse.json({ error: "Pet não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ overview });
  } catch (error) {
    return authErrorResponse(error);
  }
}
