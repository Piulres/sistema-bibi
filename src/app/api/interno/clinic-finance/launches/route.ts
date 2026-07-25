import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import {
  createExamLaunch,
  listExamLaunches,
} from "@/lib/clinic-finance/service";

export async function GET(request: Request) {
  try {
    const user = await requireInternoModule("gestao");
    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get("year") || undefined);
    const month = Number(searchParams.get("month") || undefined);
    const launches = await listExamLaunches(
      user.tenantId,
      Number.isFinite(year) ? year : undefined,
      Number.isFinite(month) ? month : undefined,
    );
    return NextResponse.json({ launches });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("gestao");
    const body = (await request.json()) as Record<string, unknown>;
    const result = await createExamLaunch(user.tenantId, {
      performedAt: body.performedAt ? String(body.performedAt) : undefined,
      patientName: String(body.patientName ?? ""),
      providerId: String(body.providerId ?? ""),
      procedureId: String(body.procedureId ?? ""),
      paymentMethod: String(body.paymentMethod ?? ""),
      amountReceived: Number(body.amountReceived ?? 0),
      biopsies: Number(body.biopsies ?? 0),
      polypectomies: Number(body.polypectomies ?? 0),
      mucosectomies: Number(body.mucosectomies ?? 0),
      clips: Number(body.clips ?? 0),
      notes: body.notes ? String(body.notes) : undefined,
      patientId: body.patientId ? String(body.patientId) : undefined,
      createdById: user.id,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
