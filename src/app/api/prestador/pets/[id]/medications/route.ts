import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import {
  createMedicationPrescription,
  listPatientMedications,
} from "@/lib/medication-service";
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

    const medications = await listPatientMedications(pet.patientId, user.tenantId, { petId });
    return NextResponse.json({ medications });
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
      medication?: string;
      dosage?: string;
      frequency?: string;
      route?: string;
      durationDays?: number;
      notes?: string;
    };

    if (!body.medication?.trim() || !body.dosage?.trim() || !body.frequency?.trim()) {
      return NextResponse.json(
        { error: "Informe medicamento, dose e frequência" },
        { status: 400 },
      );
    }

    const medication = await createMedicationPrescription({
      patientId: pet.patientId,
      petId,
      tenantId: user.tenantId,
      providerId: user.id,
      appointmentId: body.appointmentId,
      medication: body.medication,
      dosage: body.dosage,
      frequency: body.frequency,
      route: body.route,
      durationDays: body.durationDays,
      notes: body.notes,
      patientName: `${pet.name} (${pet.patient.name})`,
    });

    return NextResponse.json({ medication });
  } catch (error) {
    if (error instanceof Error && error.message === "Pet não encontrado") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return authErrorResponse(error);
  }
}
