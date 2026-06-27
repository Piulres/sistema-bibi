import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { getBdiBreakdown, upsertBdiBreakdown } from "@/lib/project/bdi-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await requireInternoModule("projetos");
    await params;
    const budgetId = new URL(request.url).searchParams.get("budgetId");
    if (!budgetId) return NextResponse.json({ error: "budgetId obrigatório" }, { status: 400 });
    const breakdown = await getBdiBreakdown(user.tenantId, budgetId);
    return NextResponse.json({ breakdown });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await requireInternoModule("projetos");
    await params;
    const body = (await request.json()) as Record<string, unknown>;
    const budgetId = String(body.budgetId ?? "");
    const result = await upsertBdiBreakdown(user.tenantId, budgetId, {
      administration: Number(body.administration ?? 0),
      risk: Number(body.risk ?? 0),
      profit: Number(body.profit ?? 0),
      taxes: Number(body.taxes ?? 0),
      financial: Number(body.financial ?? 0),
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
