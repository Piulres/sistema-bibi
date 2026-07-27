import { NextResponse } from "next/server";
import { requireBeneficiary, authErrorResponse } from "@/lib/api-auth";
import {
  cancelBeneficiaryAppointment,
  rescheduleBeneficiaryAppointment,
} from "@/lib/scheduling-service";

/** Cancela ou reagenda consulta self-service (somente status AGENDADO). */
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/beneficiario/appointments/[id]">,
) {
  try {
    const user = await requireBeneficiary();

    const { id } = await ctx.params;
    const body = (await request.json()) as {
      action?: string;
      scheduledAt?: string;
      providerId?: string | null;
    };

    if (body.action === "cancel") {
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
    }

    if (body.action === "reschedule") {
      if (!body.scheduledAt) {
        return NextResponse.json({ error: "Informe o novo horário" }, { status: 400 });
      }

      const result = await rescheduleBeneficiaryAppointment({
        tenantId: user.tenantId,
        patientId: user.patientId,
        appointmentId: id,
        scheduledAt: new Date(body.scheduledAt),
        providerId: body.providerId,
        createdBy: user.id,
      });

      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
