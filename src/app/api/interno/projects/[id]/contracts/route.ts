import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import {
  listProjectContracts,
  upsertContractAddendum,
  upsertProjectContract,
} from "@/lib/project/contract-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireInternoModule("projetos");
    const { id } = await params;
    const contracts = await listProjectContracts(user.tenantId, id);
    return NextResponse.json({ contracts });
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

    if (action === "addendum") {
      const result = await upsertContractAddendum(user.tenantId, String(body.contractId ?? ""), {
        id: body.id ? String(body.id) : undefined,
        addendumNumber: Number(body.addendumNumber ?? 1),
        title: String(body.title ?? ""),
        description: body.description ? String(body.description) : null,
        valueDelta: body.valueDelta != null ? Number(body.valueDelta) : undefined,
        scheduleDeltaDays:
          body.scheduleDeltaDays != null ? Number(body.scheduleDeltaDays) : undefined,
        status: body.status ? String(body.status) : undefined,
        signedAt: body.signedAt ? String(body.signedAt) : null,
      });
      if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json(result);
    }

    const result = await upsertProjectContract(user.tenantId, projectId, {
      id: body.id ? String(body.id) : undefined,
      contractNumber: String(body.contractNumber ?? ""),
      title: String(body.title ?? ""),
      totalValue: Number(body.totalValue ?? 0),
      status: body.status ? String(body.status) : undefined,
      notes: body.notes ? String(body.notes) : null,
      signedAt: body.signedAt ? String(body.signedAt) : null,
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
