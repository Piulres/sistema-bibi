import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { buildBudgetPdfBuffer } from "@/lib/exports/budget-pdf";
import { getBudgetPdfData } from "@/lib/project/project-service";
import { serveBufferExport } from "@/lib/exports/serve";

type RouteParams = { params: Promise<{ id: string; budgetId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireInternoModule("projetos");
    const { id: projectId, budgetId } = await params;

    const data = await getBudgetPdfData(user.tenantId, projectId, budgetId);
    if (!data) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
    }

    const buffer = await buildBudgetPdfBuffer(data);
    return serveBufferExport("pdf", `orcamento-${data.project.code}-v${data.budget.version}`, buffer);
  } catch (error) {
    return authErrorResponse(error);
  }
}
