import { NextResponse } from "next/server";
import { requireBeneficiary, authErrorResponse } from "@/lib/api-auth";
import { listPets } from "@/lib/pet-service";

export async function GET() {
  try {
    const user = await requireBeneficiary();

    const pets = await listPets(user.tenantId, { patientId: user.patientId });
    return NextResponse.json({ pets });
  } catch (error) {
    return authErrorResponse(error);
  }
}
