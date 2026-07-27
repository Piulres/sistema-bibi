import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import {
  createPrescriptionDocument,
  listPrescriptionDocuments,
  type PrescriptionItemInput,
} from "@/lib/prescription-document-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id: patientId } = await params;
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("appointmentId") ?? undefined;

    const documents = await listPrescriptionDocuments(patientId, user.tenantId, {
      appointmentId,
    });

    return NextResponse.json({ documents });
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
      petId?: string;
      prescriptionKind?: string;
      title?: string;
      notes?: string;
      items?: PrescriptionItemInput[];
    };

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId: user.tenantId },
    });
    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    const document = await createPrescriptionDocument({
      patientId,
      tenantId: user.tenantId,
      providerId: user.id,
      appointmentId: body.appointmentId,
      petId: body.petId,
      prescriptionKind: body.prescriptionKind,
      title: body.title,
      notes: body.notes,
      items: body.items ?? [],
      patientName: patient.name,
    });

    return NextResponse.json({ document });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar receita";
    if (message.includes("Informe")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return authErrorResponse(error);
  }
}
