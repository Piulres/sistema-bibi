import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";

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

    const record = await prisma.medicalRecord.create({
      data: {
        patientId: body.patientId,
        appointmentId: body.appointmentId ?? null,
        providerId: user.id,
        content: body.content.trim(),
      },
    });

    return NextResponse.json({
      record: { id: record.id, content: record.content, createdAt: record.createdAt },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
