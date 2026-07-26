import { NextResponse } from "next/server";
import { requireBeneficiary, authErrorResponse } from "@/lib/api-auth";
import { listProjectsForPatient } from "@/lib/project/financial-report-service";

export async function GET() {
  try {
    const user = await requireBeneficiary();
    const projects = await listProjectsForPatient(user.tenantId, user.patientId);
    return NextResponse.json({ projects });
  } catch (error) {
    return authErrorResponse(error);
  }
}
