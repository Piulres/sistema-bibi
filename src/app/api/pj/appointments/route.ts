import { NextResponse } from "next/server";
import { requirePj, authErrorResponse } from "@/lib/api-auth";
import { bookPjAppointment } from "@/lib/pj-appointment-service";
import { isAppointmentModality } from "@/lib/telemedicine";

export async function POST(request: Request) {
  try {
    const user = await requirePj();

    const body = (await request.json()) as {
      patientId?: string;
      providerId?: string;
      procedureId?: string;
      petId?: string | null;
      scheduledAt?: string;
      reason?: string | null;
      modality?: string;
      autoAssignProvider?: boolean;
    };

    if (!body.patientId) {
      return NextResponse.json({ error: "Informe o beneficiário" }, { status: 400 });
    }
    if (!body.scheduledAt) {
      return NextResponse.json({ error: "Informe o horário" }, { status: 400 });
    }
    if (!body.providerId && !body.autoAssignProvider) {
      return NextResponse.json(
        { error: "Informe o prestador ou escolha sem preferência" },
        { status: 400 },
      );
    }
    if (body.modality && !isAppointmentModality(body.modality)) {
      return NextResponse.json({ error: "Modalidade inválida" }, { status: 400 });
    }

    const result = await bookPjAppointment({
      tenantId: user.tenantId,
      companyId: user.companyId,
      patientId: body.patientId,
      petId: body.petId,
      providerId: body.providerId,
      procedureId: body.procedureId,
      scheduledAt: new Date(body.scheduledAt),
      reason: body.reason,
      modality: body.modality,
      autoAssignProvider: body.autoAssignProvider,
      createdBy: user.id,
    });

    if ("error" in result) {
      const status = result.error.includes("não encontrado") ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
