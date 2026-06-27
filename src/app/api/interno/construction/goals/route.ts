import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { listSalesGoals, upsertSalesGoal } from "@/lib/project/pipeline-service";

export async function GET(request: Request) {
  try {
    const user = await requireInternoModule("projetos");
    const year = Number(new URL(request.url).searchParams.get("year") ?? new Date().getFullYear());
    const goals = await listSalesGoals(user.tenantId, year);
    return NextResponse.json({ goals });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("projetos");
    const body = (await request.json()) as Record<string, unknown>;
    const result = await upsertSalesGoal(user.tenantId, {
      year: Number(body.year ?? new Date().getFullYear()),
      month: Number(body.month ?? 1),
      targetRevenue: Number(body.targetRevenue ?? 0),
      targetBdiCoverage: Number(body.targetBdiCoverage ?? 0),
      notes: body.notes ? String(body.notes) : null,
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
