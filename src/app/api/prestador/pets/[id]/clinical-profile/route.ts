import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { getPetClinicalProfile, upsertPetClinicalProfile } from "@/lib/pet-clinical-profile-service";
import type { AllergyEntry, ChronicConditionEntry } from "@/lib/clinical/constants";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id: petId } = await params;
    const profile = await getPetClinicalProfile(petId, user.tenantId);
    if (!profile) {
      return NextResponse.json({ error: "Pet não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ profile });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id: petId } = await params;
    const body = (await request.json()) as {
      allergies?: AllergyEntry[];
      chronicConditions?: ChronicConditionEntry[];
    };

    const profile = await upsertPetClinicalProfile(petId, user.tenantId, body);
    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof Error && error.message === "Pet não encontrado") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return authErrorResponse(error);
  }
}
