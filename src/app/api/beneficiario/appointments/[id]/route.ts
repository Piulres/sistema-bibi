import { NextResponse } from "next/server";
import { requireBeneficiary, authErrorResponse } from "@/lib/api-auth";
import { cancelBeneficiaryAppointment } from "@/lib/scheduling-service";

/** Cancela consulta self-service (somente status AGENDADO). */
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/beneficiario/appointments/[id]">,
) {
  try {
    const user = await requireBeneficiary();

    const { id } = await ctx.params;
    const body = (await request.json()) as { action?: string };

    if (body.action !== "cancel") {
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }

    const result = await cancelBeneficiaryAppointment({
      tenantId: user.tenantId,
      patientId: user.patientId,
      appointmentId: id,
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
