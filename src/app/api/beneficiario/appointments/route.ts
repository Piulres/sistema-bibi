import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { bookBeneficiaryAppointment } from "@/lib/scheduling-service";
import { isAppointmentModality } from "@/lib/telemedicine";

export async function POST(request: Request) {
  try {
    const user = await requireUser(["BENEFICIARIO"]);

    if (!user.patientId) {
      return NextResponse.json({ error: "Conta sem beneficiário vinculado" }, { status: 403 });
    }

    const body = (await request.json()) as {
      providerId?: string;
      scheduledAt?: string;
      reason?: string | null;
      modality?: string;
    };

    if (!body.providerId || !body.scheduledAt) {
      return NextResponse.json({ error: "Informe prestador e horário" }, { status: 400 });
    }

    if (body.modality && !isAppointmentModality(body.modality)) {
      return NextResponse.json({ error: "Modalidade inválida" }, { status: 400 });
    }

    const result = await bookBeneficiaryAppointment({
      tenantId: user.tenantId,
      patientId: user.patientId,
      providerId: body.providerId,
      scheduledAt: new Date(body.scheduledAt),
      reason: body.reason,
      modality: body.modality,
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
