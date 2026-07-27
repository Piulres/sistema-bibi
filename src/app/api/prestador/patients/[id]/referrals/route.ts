import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import {
  createClinicalReferral,
  listClinicalReferrals,
} from "@/lib/clinical-referral-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id: patientId } = await params;
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("appointmentId") ?? undefined;
    const petId = searchParams.get("petId") ?? undefined;

    const referrals = await listClinicalReferrals(patientId, user.tenantId, {
      appointmentId,
      petId,
    });

    return NextResponse.json({ referrals });
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
      referralKind?: string;
      specialty?: string;
      urgency?: string;
      clinicalReason?: string;
      historySummary?: string;
      requestedActions?: string;
    };

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId: user.tenantId },
    });
    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    const referral = await createClinicalReferral({
      patientId,
      tenantId: user.tenantId,
      providerId: user.id,
      appointmentId: body.appointmentId,
      petId: body.petId,
      referralKind: body.referralKind,
      specialty: body.specialty ?? "",
      urgency: body.urgency,
      clinicalReason: body.clinicalReason ?? "",
      historySummary: body.historySummary,
      requestedActions: body.requestedActions,
      patientName: patient.name,
    });

    return NextResponse.json({ referral });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar encaminhamento";
    if (message.includes("Informe")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return authErrorResponse(error);
  }
}
