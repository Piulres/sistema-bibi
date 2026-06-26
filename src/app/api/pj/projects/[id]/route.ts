import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { getProjectForCompany } from "@/lib/project/project-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["PJ"]);
    if (!user.companyId) {
      return NextResponse.json({ error: "Usuário sem empresa vinculada" }, { status: 400 });
    }

    const { id } = await params;
    const project = await getProjectForCompany(user.tenantId, user.companyId, id);
    if (!project) {
      return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    return authErrorResponse(error);
  }
}
