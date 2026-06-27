import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import {
  addAllocationPayment,
  listProjectAllocations,
  upsertProjectAllocation,
} from "@/lib/project/allocation-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireInternoModule("projetos");
    const { id } = await params;
    const allocations = await listProjectAllocations(user.tenantId, id);
    return NextResponse.json({ allocations });
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

    if (action === "payment") {
      const result = await addAllocationPayment(user.tenantId, String(body.allocationId ?? ""), {
        amount: Number(body.amount ?? 0),
        paymentType: String(body.paymentType ?? "PAGAMENTO"),
        paymentDate: String(body.paymentDate ?? new Date().toISOString()),
        notes: body.notes ? String(body.notes) : null,
      });
      if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json(result);
    }

    const result = await upsertProjectAllocation(user.tenantId, projectId, {
      id: body.id ? String(body.id) : undefined,
      providerId: String(body.providerId ?? ""),
      trade: String(body.trade ?? ""),
      contractType: String(body.contractType ?? "DIARIA"),
      contractValue: Number(body.contractValue ?? 0),
      dailyRate: body.dailyRate != null ? Number(body.dailyRate) : null,
      status: body.status ? String(body.status) : undefined,
      notes: body.notes ? String(body.notes) : null,
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
