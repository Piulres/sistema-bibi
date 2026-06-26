import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import {
  createFieldReport,
  listFieldReportsForProvider,
} from "@/lib/project/field-report-service";

export async function GET() {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const reports = await listFieldReportsForProvider(user.tenantId, user.id);
    return NextResponse.json({ reports });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const body = (await request.json()) as Record<string, unknown>;

    const result = await createFieldReport({
      tenantId: user.tenantId,
      authorId: user.id,
      projectId: String(body.projectId ?? ""),
      taskId: body.taskId ? String(body.taskId) : null,
      reportDate: String(body.reportDate ?? new Date().toISOString().slice(0, 10)),
      trade: String(body.trade ?? ""),
      locationNote: body.locationNote ? String(body.locationNote) : null,
      latitude: body.latitude != null ? Number(body.latitude) : null,
      longitude: body.longitude != null ? Number(body.longitude) : null,
      workDone: String(body.workDone ?? ""),
      pendingWork: body.pendingWork ? String(body.pendingWork) : null,
      progressPercent: body.progressPercent != null ? Number(body.progressPercent) : null,
      diariaAmount: body.diariaAmount != null ? Number(body.diariaAmount) : null,
    });

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
