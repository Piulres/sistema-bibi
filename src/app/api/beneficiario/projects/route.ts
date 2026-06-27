import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { listProjectsForPatient } from "@/lib/project/financial-report-service";

export async function GET() {
  try {
    const user = await requireUser(["BENEFICIARIO"]);
    if (!user.patientId) {
      return NextResponse.json({ error: "Beneficiário não vinculado" }, { status: 400 });
    }
    const projects = await listProjectsForPatient(user.tenantId, user.patientId);
    return NextResponse.json({ projects });
  } catch (error) {
    return authErrorResponse(error);
  }
}
