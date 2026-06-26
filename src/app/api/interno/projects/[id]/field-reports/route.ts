import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import {
  approveAndBillFieldReport,
  listFieldReportsForProject,
} from "@/lib/project/field-report-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireInternoModule("projetos");
    const { id } = await params;
    const reports = await listFieldReportsForProject(user.tenantId, id);
    return NextResponse.json({ reports });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await requireInternoModule("projetos");
    const { id: projectId } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "");

    if (action === "approve") {
      const prisma = await (await import("@/lib/db")).getPrisma();
      const report = await prisma.dailyFieldReport.findFirst({
        where: {
          id: String(body.reportId ?? ""),
          tenantId: user.tenantId,
          projectId,
        },
      });
      if (!report) {
        return NextResponse.json({ error: "RDO não encontrado nesta obra" }, { status: 404 });
      }

      const result = await approveAndBillFieldReport({
        tenantId: user.tenantId,
        reportId: String(body.reportId ?? ""),
        approvedBy: user.id,
      });
      if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json(result);
    }

    void projectId;
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
