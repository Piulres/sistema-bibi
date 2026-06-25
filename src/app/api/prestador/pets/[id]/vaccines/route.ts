import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { createPetVaccine, listPetVaccines } from "@/lib/pet-vaccine-service";
import { getPrestadorPetContext } from "@/lib/pet-api-context";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id: petId } = await params;
    const pet = await getPrestadorPetContext(user.tenantId, petId);
    if (!pet) {
      return NextResponse.json({ error: "Pet não encontrado" }, { status: 404 });
    }

    const vaccines = await listPetVaccines(petId, user.tenantId);
    return NextResponse.json({ vaccines });
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
      vaccineName?: string;
      doseLabel?: string;
      appliedAt?: string;
      nextDueAt?: string;
      batchNumber?: string;
      notes?: string;
      status?: "APLICADA" | "PENDENTE" | "VENCIDA";
    };

    if (!body.vaccineName?.trim()) {
      return NextResponse.json({ error: "Informe o nome da vacina" }, { status: 400 });
    }

    const vaccine = await createPetVaccine({
      petId,
      tenantId: user.tenantId,
      providerId: user.id,
      appointmentId: body.appointmentId,
      vaccineName: body.vaccineName,
      doseLabel: body.doseLabel,
      appliedAt: body.appliedAt,
      nextDueAt: body.nextDueAt,
      batchNumber: body.batchNumber,
      notes: body.notes,
      status: body.status,
      petName: pet.name,
    });

    return NextResponse.json({ vaccine });
  } catch (error) {
    return authErrorResponse(error);
  }
}
