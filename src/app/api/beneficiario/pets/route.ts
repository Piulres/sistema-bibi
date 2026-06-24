import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { listPets } from "@/lib/pet-service";

export async function GET() {
  try {
    const user = await requireUser(["BENEFICIARIO"]);
    if (!user.patientId) {
      return NextResponse.json({ error: "Beneficiário sem cadastro vinculado" }, { status: 400 });
    }

    const pets = await listPets(user.tenantId, { patientId: user.patientId });
    return NextResponse.json({ pets });
  } catch (error) {
    return authErrorResponse(error);
  }
}
