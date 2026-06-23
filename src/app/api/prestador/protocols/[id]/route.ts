import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { updateProtocolChecklist } from "@/lib/care-protocol-service";
import {
  PROTOCOL_ENROLLMENT_STATUSES,
  type ProtocolEnrollmentStatus,
} from "@/lib/clinical/constants";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const prisma = await getPrisma();
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id } = await params;
    const body = (await request.json()) as {
      checklistState?: Record<string, boolean>;
      status?: string;
    };

    if (!body.checklistState && !body.status) {
      return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
    }

    if (
      body.status &&
      !PROTOCOL_ENROLLMENT_STATUSES.includes(body.status as ProtocolEnrollmentStatus)
    ) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const existing = await prisma.patientProtocolEnrollment.findFirst({
      where: { id, patient: { tenantId: user.tenantId } },
      include: { patient: { select: { name: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Protocolo não encontrado" }, { status: 404 });
    }

    const currentState = JSON.parse(existing.checklistState || "{}") as Record<string, boolean>;
    const enrollment = await updateProtocolChecklist({
      id,
      tenantId: user.tenantId,
      providerId: user.id,
      patientName: existing.patient.name,
      checklistState: body.checklistState ?? currentState,
      status: body.status as ProtocolEnrollmentStatus | undefined,
    });

    return NextResponse.json({ enrollment });
  } catch (error) {
    return authErrorResponse(error);
  }
}
