import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import {
  recordTimelineEvent,
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "@/lib/timeline";

/** Adiciona uma anotacao ao prontuario (PEP) do paciente. */
export async function POST(request: Request) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const body = (await request.json()) as {
      patientId?: string;
      appointmentId?: string;
      content?: string;
    };

    if (!body.patientId || !body.content?.trim()) {
      return NextResponse.json(
        { error: "Informe o paciente e o conteúdo da anotação" },
        { status: 400 },
      );
    }

    const patient = await prisma.patient.findFirst({
      where: { id: body.patientId, tenantId: user.tenantId },
    });
    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    if (body.appointmentId) {
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: body.appointmentId,
          patientId: body.patientId,
          providerId: user.id,
          tenantId: user.tenantId,
        },
      });
      if (!appointment) {
        return NextResponse.json({ error: "Atendimento não encontrado" }, { status: 404 });
      }
    }

    const record = await prisma.medicalRecord.create({
      data: {
        patientId: body.patientId,
        appointmentId: body.appointmentId ?? null,
        providerId: user.id,
        content: body.content.trim(),
      },
    });

    await recordTimelineEvent({
      tenantId: user.tenantId,
      entityType: TIMELINE_ENTITY_TYPES.MEDICAL_RECORD,
      entityId: record.id,
      action: TIMELINE_ACTIONS.MEDICAL_RECORD_CREATED,
      description: `Anotação clínica registrada no prontuário de ${patient.name}`,
      createdBy: user.id,
    });

    return NextResponse.json({
      record: { id: record.id, content: record.content, createdAt: record.createdAt },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
