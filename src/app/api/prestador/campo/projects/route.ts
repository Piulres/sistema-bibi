import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { listProjectsForProvider } from "@/lib/project/field-report-service";

export async function GET() {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const projects = await listProjectsForProvider(user.tenantId, user.id);
    return NextResponse.json({ projects });
  } catch (error) {
    return authErrorResponse(error);
  }
}
