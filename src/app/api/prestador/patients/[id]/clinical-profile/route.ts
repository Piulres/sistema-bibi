import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { getClinicalProfile, upsertClinicalProfile } from "@/lib/clinical-profile-service";
import type { AllergyEntry, ChronicConditionEntry } from "@/lib/clinical/constants";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id: patientId } = await params;
    const profile = await getClinicalProfile(patientId, user.tenantId);
    if (!profile) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ profile });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id: patientId } = await params;
    const body = (await request.json()) as {
      allergies?: AllergyEntry[];
      chronicConditions?: ChronicConditionEntry[];
      bloodType?: string | null;
    };

    const profile = await upsertClinicalProfile(patientId, user.tenantId, body);
    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof Error && error.message === "Paciente não encontrado") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return authErrorResponse(error);
  }
}
