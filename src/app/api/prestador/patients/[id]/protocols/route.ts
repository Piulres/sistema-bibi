import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import {
  enrollPatientInProtocol,
  listPatientProtocolEnrollments,
  listProtocolTemplates,
} from "@/lib/care-protocol-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id: patientId } = await params;
    const [enrollments, templates] = await Promise.all([
      listPatientProtocolEnrollments(patientId, user.tenantId),
      listProtocolTemplates(user.tenantId),
    ]);
    return NextResponse.json({ enrollments, templates });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const prisma = await getPrisma();
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id: patientId } = await params;
    const body = (await request.json()) as {
      templateId?: string;
      appointmentId?: string;
    };

    if (!body.templateId) {
      return NextResponse.json({ error: "Informe o protocolo" }, { status: 400 });
    }

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId: user.tenantId },
    });
    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    const enrollment = await enrollPatientInProtocol({
      patientId,
      tenantId: user.tenantId,
      providerId: user.id,
      templateId: body.templateId,
      appointmentId: body.appointmentId,
      patientName: patient.name,
    });

    return NextResponse.json({ enrollment });
  } catch (error) {
    if (error instanceof Error && error.message === "Protocolo não encontrado") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return authErrorResponse(error);
  }
}
