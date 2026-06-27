import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { listPipeline, upsertPipelineEntry } from "@/lib/project/pipeline-service";

export async function GET() {
  try {
    const user = await requireInternoModule("projetos");
    const pipeline = await listPipeline(user.tenantId);
    return NextResponse.json(pipeline);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("projetos");
    const body = (await request.json()) as Record<string, unknown>;
    const result = await upsertPipelineEntry(user.tenantId, {
      id: body.id ? String(body.id) : undefined,
      contactName: String(body.contactName ?? ""),
      projectName: body.projectName ? String(body.projectName) : null,
      estimatedValue: Number(body.estimatedValue ?? 0),
      status: String(body.status ?? "LEAD"),
      probability: body.probability != null ? Number(body.probability) : undefined,
      expectedClose: body.expectedClose ? String(body.expectedClose) : null,
      companyId: body.companyId ? String(body.companyId) : null,
      projectId: body.projectId ? String(body.projectId) : null,
      notes: body.notes ? String(body.notes) : null,
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
