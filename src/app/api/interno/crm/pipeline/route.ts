import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { getCompanyPipeline } from "@/lib/company-pipeline";

/** Pipeline CRM corporativo — empresas agrupadas por status. */
export async function GET() {
  try {
    const user = await requireUser(["INTERNO"]);
    const data = await getCompanyPipeline(user.tenantId);
    return NextResponse.json(data);
  } catch (error) {
    return authErrorResponse(error);
  }
}
