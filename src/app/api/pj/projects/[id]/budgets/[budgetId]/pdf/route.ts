import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { buildBudgetPdfBuffer } from "@/lib/exports/budget-pdf";
import { getBudgetPdfData, getProjectForCompany } from "@/lib/project/project-service";
import { serveBufferExport } from "@/lib/exports/serve";

type RouteParams = { params: Promise<{ id: string; budgetId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["PJ"]);
    if (!user.companyId) {
      return NextResponse.json({ error: "Usuário sem empresa vinculada" }, { status: 400 });
    }

    const { id: projectId, budgetId } = await params;
    const project = await getProjectForCompany(user.tenantId, user.companyId, projectId);
    if (!project) {
      return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
    }

    const data = await getBudgetPdfData(user.tenantId, projectId, budgetId);
    if (!data) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
    }

    const buffer = await buildBudgetPdfBuffer(data);
    return serveBufferExport("pdf", `proposta-${data.project.code}-v${data.budget.version}`, buffer);
  } catch (error) {
    return authErrorResponse(error);
  }
}
