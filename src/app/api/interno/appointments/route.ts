import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import {
  createAppointment,
  isAppointmentStatus,
  listAppointments,
  listProviders,
} from "@/lib/appointment-service";
import { isAppointmentModality } from "@/lib/telemedicine";
import { listPatients } from "@/lib/patient-service";

export async function GET(request: Request) {
  try {
    const user = await requireInternoModule("agenda");
    const url = new URL(request.url);
    const dateParam = url.searchParams.get("date");
    const providerId = url.searchParams.get("providerId") ?? undefined;

    let from: Date | undefined;
    let to: Date | undefined;
    if (dateParam) {
      from = new Date(`${dateParam}T00:00:00`);
      to = new Date(`${dateParam}T23:59:59.999`);
    }

    const [appointments, providers, patients] = await Promise.all([
      listAppointments({ tenantId: user.tenantId, from, to, providerId }),
      listProviders(user.tenantId),
      listPatients(user.tenantId),
    ]);

    return NextResponse.json({ appointments, providers, patients });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("agenda");
    const body = (await request.json()) as {
      patientId?: string;
      providerId?: string;
      scheduledAt?: string;
      reason?: string | null;
      status?: string;
      modality?: string;
    };

    if (!body.patientId || !body.providerId || !body.scheduledAt) {
      return NextResponse.json(
        { error: "Informe paciente, prestador e data/hora" },
        { status: 400 },
      );
    }
    if (body.status && !isAppointmentStatus(body.status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }
    if (body.modality && !isAppointmentModality(body.modality)) {
      return NextResponse.json({ error: "Modalidade inválida" }, { status: 400 });
    }

    const result = await createAppointment({
      tenantId: user.tenantId,
      patientId: body.patientId,
      providerId: body.providerId,
      scheduledAt: new Date(body.scheduledAt),
      reason: body.reason,
      status: body.status,
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
