import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { cancelClinicalReferral } from "@/lib/clinical-referral-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id } = await params;
    const body = (await request.json()) as { status?: string };

    if (body.status !== "CANCELADO") {
      return NextResponse.json(
        { error: "Status suportado: CANCELADO" },
        { status: 400 },
      );
    }

    const referral = await cancelClinicalReferral({
      referralId: id,
      tenantId: user.tenantId,
      providerId: user.id,
    });

    if (!referral) {
      return NextResponse.json({ error: "Encaminhamento não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ referral });
  } catch (error) {
    return authErrorResponse(error);
  }
}
