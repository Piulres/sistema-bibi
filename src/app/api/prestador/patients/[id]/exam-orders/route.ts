import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { createExamOrder, listPatientExamOrders } from "@/lib/exam-order-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id: patientId } = await params;
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("appointmentId") ?? undefined;
    const examOrders = await listPatientExamOrders(patientId, user.tenantId, {
      appointmentId,
    });
    return NextResponse.json({ examOrders });
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
      appointmentId?: string;
      procedureId?: string;
      examName?: string;
      clinicalIndication?: string;
    };

    if (!body.examName?.trim() && !body.procedureId) {
      return NextResponse.json(
        { error: "Informe o nome do exame ou selecione um procedimento" },
        { status: 400 },
      );
    }

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId: user.tenantId },
    });
    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    const examOrder = await createExamOrder({
      patientId,
      tenantId: user.tenantId,
      providerId: user.id,
      appointmentId: body.appointmentId,
      procedureId: body.procedureId,
      examName: body.examName ?? "",
      clinicalIndication: body.clinicalIndication,
      patientName: patient.name,
    });

    return NextResponse.json({ examOrder });
  } catch (error) {
    if (error instanceof Error && error.message === "Procedimento não encontrado") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return authErrorResponse(error);
  }
}
