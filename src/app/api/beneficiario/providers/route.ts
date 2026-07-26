import { NextResponse } from "next/server";
import { requireBeneficiary, authErrorResponse } from "@/lib/api-auth";
import { listProviders } from "@/lib/appointment-service";

export async function GET() {
  try {
    const user = await requireBeneficiary();
    const providers = await listProviders(user.tenantId);
    return NextResponse.json({ providers });
  } catch (error) {
    return authErrorResponse(error);
  }
}
