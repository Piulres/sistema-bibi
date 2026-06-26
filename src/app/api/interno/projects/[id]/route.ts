import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { getProjectDetail, updateProject } from "@/lib/project/project-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireInternoModule("projetos");
    const { id } = await params;
    const project = await getProjectDetail(user.tenantId, id);
    if (!project) {
      return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await requireInternoModule("projetos");
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    const result = await updateProject({
      tenantId: user.tenantId,
      projectId: id,
      name: body.name !== undefined ? String(body.name) : undefined,
      status: body.status !== undefined ? String(body.status) : undefined,
      companyId: body.companyId !== undefined ? (body.companyId ? String(body.companyId) : null) : undefined,
      managerId: body.managerId !== undefined ? (body.managerId ? String(body.managerId) : null) : undefined,
      addressStreet:
        body.addressStreet !== undefined
          ? body.addressStreet
            ? String(body.addressStreet)
            : null
          : undefined,
      addressCity:
        body.addressCity !== undefined
          ? body.addressCity
            ? String(body.addressCity)
            : null
          : undefined,
      addressState:
        body.addressState !== undefined
          ? body.addressState
            ? String(body.addressState)
            : null
          : undefined,
      addressZip:
        body.addressZip !== undefined
          ? body.addressZip
            ? String(body.addressZip)
            : null
          : undefined,
      startDate:
        body.startDate !== undefined
          ? body.startDate
            ? String(body.startDate)
            : null
          : undefined,
      endDate:
        body.endDate !== undefined
          ? body.endDate
            ? String(body.endDate)
            : null
          : undefined,
      notes: body.notes !== undefined ? (body.notes ? String(body.notes) : null) : undefined,
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
