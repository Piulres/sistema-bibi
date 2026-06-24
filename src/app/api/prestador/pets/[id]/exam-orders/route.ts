import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { createExamOrder, listPatientExamOrders } from "@/lib/exam-order-service";
import { getPrestadorPetContext } from "@/lib/pet-api-context";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id: petId } = await params;
    const pet = await getPrestadorPetContext(user.tenantId, petId);
    if (!pet) {
      return NextResponse.json({ error: "Pet não encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("appointmentId") ?? undefined;
    const examOrders = await listPatientExamOrders(pet.patientId, user.tenantId, {
      appointmentId,
      petId,
    });
    return NextResponse.json({ examOrders });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id: petId } = await params;
    const pet = await getPrestadorPetContext(user.tenantId, petId);
    if (!pet) {
      return NextResponse.json({ error: "Pet não encontrado" }, { status: 404 });
    }

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

    const examOrder = await createExamOrder({
      patientId: pet.patientId,
      petId,
      tenantId: user.tenantId,
      providerId: user.id,
      appointmentId: body.appointmentId,
      procedureId: body.procedureId,
      examName: body.examName ?? "",
      clinicalIndication: body.clinicalIndication,
      patientName: `${pet.name} (${pet.patient.name})`,
    });

    return NextResponse.json({ examOrder });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Pet não encontrado" || error.message === "Procedimento não encontrado") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }
    return authErrorResponse(error);
  }
}
