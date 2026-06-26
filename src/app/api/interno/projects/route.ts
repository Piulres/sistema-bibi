import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import {
  createProject,
  listProjectPipeline,
  listProjects,
} from "@/lib/project/project-service";

export async function GET(request: Request) {
  try {
    const user = await requireInternoModule("projetos");
    const { searchParams } = new URL(request.url);
    if (searchParams.get("view") === "pipeline") {
      const data = await listProjectPipeline(user.tenantId);
      return NextResponse.json(data);
    }
    const projects = await listProjects(user.tenantId);
    return NextResponse.json({ projects });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("projetos");
    const body = (await request.json()) as Record<string, unknown>;

    const result = await createProject({
      tenantId: user.tenantId,
      code: String(body.code ?? ""),
      name: String(body.name ?? ""),
      status: body.status ? String(body.status) : undefined,
      companyId: body.companyId ? String(body.companyId) : null,
      managerId: body.managerId ? String(body.managerId) : null,
      addressStreet: body.addressStreet ? String(body.addressStreet) : null,
      addressCity: body.addressCity ? String(body.addressCity) : null,
      addressState: body.addressState ? String(body.addressState) : null,
      addressZip: body.addressZip ? String(body.addressZip) : null,
      startDate: body.startDate ? String(body.startDate) : null,
      endDate: body.endDate ? String(body.endDate) : null,
      notes: body.notes ? String(body.notes) : null,
      createdBy: user.id,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
