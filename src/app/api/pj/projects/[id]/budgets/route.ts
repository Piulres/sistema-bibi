import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { approveBudgetByPj, rejectBudget, getProjectForCompany } from "@/lib/project/project-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["PJ"]);
    if (!user.companyId) {
      return NextResponse.json({ error: "Usuário sem empresa vinculada" }, { status: 400 });
    }

    const { id: projectId } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "");
    const budgetId = String(body.budgetId ?? "");

    const project = await getProjectForCompany(user.tenantId, user.companyId, projectId);
    if (!project) {
      return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
    }
    const budget = project.budgets.find((b) => b.id === budgetId);
    if (!budget) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
    }

    if (action === "approve") {
      const result = await approveBudgetByPj({
        tenantId: user.tenantId,
        projectId,
        budgetId,
        updatedBy: user.id,
        approvedByPjUserId: user.id,
      });
      if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json(result);
    }

    if (action === "reject") {
      const result = await rejectBudget({
        tenantId: user.tenantId,
        projectId,
        budgetId,
        updatedBy: user.id,
      });
      if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
