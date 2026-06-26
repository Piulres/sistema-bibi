import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { deleteTask, upsertTask } from "@/lib/project/project-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await requireInternoModule("projetos");
    const { id: projectId } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    const result = await upsertTask({
      tenantId: user.tenantId,
      projectId,
      taskId: body.taskId ? String(body.taskId) : undefined,
      name: String(body.name ?? ""),
      phase: body.phase ? String(body.phase) : undefined,
      status: body.status ? String(body.status) : undefined,
      startDate: body.startDate !== undefined ? (body.startDate ? String(body.startDate) : null) : undefined,
      endDate: body.endDate !== undefined ? (body.endDate ? String(body.endDate) : null) : undefined,
      progressPercent: body.progressPercent !== undefined ? Number(body.progressPercent) : undefined,
      assigneeId:
        body.assigneeId !== undefined ? (body.assigneeId ? String(body.assigneeId) : null) : undefined,
      sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
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

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await requireInternoModule("projetos");
    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    if (!taskId) {
      return NextResponse.json({ error: "Informe taskId" }, { status: 400 });
    }

    const result = await deleteTask({
      tenantId: user.tenantId,
      projectId,
      taskId,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
