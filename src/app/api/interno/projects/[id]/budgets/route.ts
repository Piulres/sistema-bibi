import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import {
  approveBudget,
  createBudgetVersion,
  sendBudget,
  upsertBudget,
} from "@/lib/project/project-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await requireInternoModule("projetos");
    const { id: projectId } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    const lineItems = Array.isArray(body.lineItems)
      ? (body.lineItems as Record<string, unknown>[]).map((li) => ({
          description: String(li.description ?? ""),
          unit: li.unit ? String(li.unit) : undefined,
          quantity: li.quantity !== undefined ? Number(li.quantity) : undefined,
          unitPrice: li.unitPrice !== undefined ? Number(li.unitPrice) : undefined,
          sortOrder: li.sortOrder !== undefined ? Number(li.sortOrder) : undefined,
        }))
      : [];

    const result = await upsertBudget({
      tenantId: user.tenantId,
      projectId,
      budgetId: body.budgetId ? String(body.budgetId) : undefined,
      bdiPercent: body.bdiPercent !== undefined ? Number(body.bdiPercent) : undefined,
      validUntil:
        body.validUntil !== undefined
          ? body.validUntil
            ? String(body.validUntil)
            : null
          : undefined,
      notes: body.notes !== undefined ? (body.notes ? String(body.notes) : null) : undefined,
      lineItems,
      updatedBy: user.id,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
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

    if (action === "send") {
      const result = await sendBudget({
        tenantId: user.tenantId,
        projectId,
        budgetId: String(body.budgetId ?? ""),
        updatedBy: user.id,
      });
      if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json(result);
    }

    if (action === "approve") {
      const result = await approveBudget({
        tenantId: user.tenantId,
        projectId,
        budgetId: String(body.budgetId ?? ""),
        updatedBy: user.id,
      });
      if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json(result);
    }

    if (action === "new-version") {
      const result = await createBudgetVersion({
        tenantId: user.tenantId,
        projectId,
        sourceBudgetId: String(body.sourceBudgetId ?? ""),
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
