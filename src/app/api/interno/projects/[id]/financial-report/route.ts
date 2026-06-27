import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { getProjectFinancialReport } from "@/lib/project/financial-report-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireInternoModule("projetos");
    const { id } = await params;
    const report = await getProjectFinancialReport(user.tenantId, id);
    if (!report) return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
    return NextResponse.json({ report });
  } catch (error) {
    return authErrorResponse(error);
  }
}
