import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import {
  deleteProjectCashEntry,
  listProjectCashEntries,
  upsertProjectCashEntry,
  getProjectCashSummary,
} from "@/lib/project/cash-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireInternoModule("projetos");
    const { id } = await params;
    const [entries, summary] = await Promise.all([
      listProjectCashEntries(user.tenantId, id),
      getProjectCashSummary(user.tenantId, id),
    ]);
    return NextResponse.json({ entries, summary });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await requireInternoModule("projetos");
    const { id: projectId } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "upsert");

    if (action === "delete") {
      const result = await deleteProjectCashEntry(user.tenantId, String(body.entryId ?? ""));
      if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    const result = await upsertProjectCashEntry(user.tenantId, projectId, {
      id: body.id ? String(body.id) : undefined,
      type: String(body.type ?? "ENTRADA"),
      category: String(body.category ?? "OUTRO"),
      description: String(body.description ?? ""),
      amount: Number(body.amount ?? 0),
      isPlanned: Boolean(body.isPlanned),
      entryDate: String(body.entryDate ?? new Date().toISOString()),
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
