import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { listDischargeDocuments } from "@/lib/clinical-discharge-service";
import { REFERRAL_TEMPLATES } from "@/lib/clinical/encaminhamento";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id: patientId } = await params;
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("appointmentId") ?? undefined;
    const petId = searchParams.get("petId") ?? undefined;

    const documents = await listDischargeDocuments(patientId, user.tenantId, {
      appointmentId,
      petId,
    });

    return NextResponse.json({
      documents,
      referralTemplates: REFERRAL_TEMPLATES,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
