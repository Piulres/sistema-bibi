import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import {
  deleteProjectEnvironment,
  listProjectEnvironments,
  upsertProjectEnvironment,
} from "@/lib/project/environment-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireInternoModule("projetos");
    const { id } = await params;
    const environments = await listProjectEnvironments(user.tenantId, id);
    return NextResponse.json({ environments });
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
      const result = await deleteProjectEnvironment(user.tenantId, String(body.environmentId ?? ""));
      if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    const result = await upsertProjectEnvironment(user.tenantId, projectId, {
      id: body.id ? String(body.id) : undefined,
      name: String(body.name ?? ""),
      environmentType: String(body.environmentType ?? "RESIDENCIAL"),
      length: body.length != null ? Number(body.length) : null,
      width: body.width != null ? Number(body.width) : null,
      height: body.height != null ? Number(body.height) : null,
      notes: body.notes ? String(body.notes) : null,
      sortOrder: body.sortOrder != null ? Number(body.sortOrder) : undefined,
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
