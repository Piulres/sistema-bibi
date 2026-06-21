import { NextResponse } from "next/server";
import { requireBeneficiary, authErrorResponse } from "@/lib/api-auth";
import { getBeneficiaryOverview } from "@/lib/beneficiary-overview";

/** Visão self-service do beneficiário logado (agenda, uso, faturas, assinatura). */
export async function GET() {
  try {
    const user = await requireBeneficiary();
    const overview = await getBeneficiaryOverview(user.patientId, user.tenantId);

    if (!overview) {
      return NextResponse.json({ error: "Beneficiário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ overview });
  } catch (error) {
    return authErrorResponse(error);
  }
}
