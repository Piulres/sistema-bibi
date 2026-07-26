import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import {
  applyExamProtocol,
  listExamProtocolTemplates,
} from "@/lib/exam-protocol-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id: patientId } = await params;
    const prisma = await getPrisma();
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId: user.tenantId },
    });
    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    const templates = await listExamProtocolTemplates(user.tenantId, true);
    return NextResponse.json({ templates });
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
      petId?: string;
      clinicalIndication?: string;
    };

    if (!body.templateId?.trim()) {
      return NextResponse.json(
        { error: "Informe o protocolo de exames" },
        { status: 400 },
      );
    }

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId: user.tenantId },
    });
    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    try {
      const result = await applyExamProtocol({
        templateId: body.templateId,
        tenantId: user.tenantId,
        patientId,
        providerId: user.id,
        appointmentId: body.appointmentId,
        petId: body.petId,
        patientName: patient.name,
        clinicalIndicationOverride: body.clinicalIndication,
      });
      return NextResponse.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao aplicar protocolo";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } catch (error) {
    return authErrorResponse(error);
  }
}
