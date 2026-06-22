import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { isAppointmentStatus, updateAppointment } from "@/lib/appointment-service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireInternoModule("agenda");
    const { id } = await params;
    const body = (await request.json()) as {
      scheduledAt?: string;
      status?: string;
      reason?: string | null;
    };

    if (body.status && !isAppointmentStatus(body.status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const result = await updateAppointment({
      tenantId: user.tenantId,
      appointmentId: id,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      status: body.status,
      reason: body.reason,
      createdBy: user.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
