import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { listProviders } from "@/lib/appointment-service";

export async function GET() {
  try {
    const user = await requireUser(["BENEFICIARIO"]);
    const providers = await listProviders(user.tenantId);
    return NextResponse.json({ providers });
  } catch (error) {
    return authErrorResponse(error);
  }
}
