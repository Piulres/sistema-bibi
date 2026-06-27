import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { getProjectForPatient } from "@/lib/project/financial-report-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["BENEFICIARIO"]);
    if (!user.patientId) {
      return NextResponse.json({ error: "Beneficiário não vinculado" }, { status: 400 });
    }
    const { id } = await params;
    const project = await getProjectForPatient(user.tenantId, user.patientId, id);
    if (!project) return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
    return NextResponse.json({ project });
  } catch (error) {
    return authErrorResponse(error);
  }
}
