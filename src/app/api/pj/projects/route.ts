import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { listProjectsForCompany } from "@/lib/project/project-service";

export async function GET() {
  try {
    const user = await requireUser(["PJ"]);
    if (!user.companyId) {
      return NextResponse.json({ error: "Usuário sem empresa vinculada" }, { status: 400 });
    }

    const projects = await listProjectsForCompany(user.tenantId, user.companyId);
    return NextResponse.json({ projects });
  } catch (error) {
    return authErrorResponse(error);
  }
}
