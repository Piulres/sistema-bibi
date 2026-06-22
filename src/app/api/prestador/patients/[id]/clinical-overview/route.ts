import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { getPatientClinicalOverview } from "@/lib/clinical-overview";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id: patientId } = await params;
    const overview = await getPatientClinicalOverview(patientId, user.tenantId);
    if (!overview) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ overview });
  } catch (error) {
    return authErrorResponse(error);
  }
}
