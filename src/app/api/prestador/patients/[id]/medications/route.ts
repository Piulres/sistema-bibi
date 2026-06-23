import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import {
  createMedicationPrescription,
  listPatientMedications,
} from "@/lib/medication-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id: patientId } = await params;
    const medications = await listPatientMedications(patientId, user.tenantId);
    return NextResponse.json({ medications });
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

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId: user.tenantId },
    });
    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    const medication = await createMedicationPrescription({
      patientId,
      tenantId: user.tenantId,
      providerId: user.id,
      appointmentId: body.appointmentId,
      medication: body.medication,
      dosage: body.dosage,
      frequency: body.frequency,
      route: body.route,
      durationDays: body.durationDays,
      notes: body.notes,
      patientName: patient.name,
    });

    return NextResponse.json({ medication });
  } catch (error) {
    return authErrorResponse(error);
  }
}
