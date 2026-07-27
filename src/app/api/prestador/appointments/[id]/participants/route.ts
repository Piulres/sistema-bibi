import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import {
  addAppointmentParticipant,
  listAppointmentParticipants,
  removeAppointmentParticipant,
} from "@/lib/appointment-team-service";
import { isTeamRole } from "@/lib/clinical/team-roles";

/** Lista participantes da equipe do atendimento. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/prestador/appointments/[id]/participants">,
) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id } = await ctx.params;

    const prisma = await getPrisma();
    const appointment = await prisma.appointment.findFirst({
      where: { id, providerId: user.id, tenantId: user.tenantId },
    });
    if (!appointment) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { niche: true },
    });

    const participants = await listAppointmentParticipants(
      id,
      user.tenantId,
      (tenant?.niche as "MEDICAL") ?? "MEDICAL",
    );

    return NextResponse.json({ participants });
  } catch (error) {
    return authErrorResponse(error);
  }
}

/** Adiciona profissional à equipe do atendimento. */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/prestador/appointments/[id]/participants">,
) {
  const prisma = await getPrisma();
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id } = await ctx.params;
    const body = (await request.json()) as {
      userId?: string;
      role?: string;
      notes?: string;
      chargeFee?: boolean;
    };

    if (!body.userId || !body.role || !isTeamRole(body.role)) {
      return NextResponse.json({ error: "Informe profissional e papel válido" }, { status: 400 });
    }

    const appointment = await prisma.appointment.findFirst({
      where: { id, providerId: user.id, tenantId: user.tenantId },
      include: { patient: { select: { name: true } } },
    });
    if (!appointment) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { niche: true },
    });

    const participant = await addAppointmentParticipant({
      appointmentId: id,
      tenantId: user.tenantId,
      providerId: user.id,
      userId: body.userId,
      role: body.role,
      notes: body.notes,
      chargeFee: body.chargeFee ?? false,
      niche: (tenant?.niche as "MEDICAL") ?? "MEDICAL",
      patientName: appointment.patient.name,
    });

    return NextResponse.json({ participant });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao adicionar participante";
    if (message.includes("não encontrado") || message.includes("já está")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return authErrorResponse(error);
  }
}

/** Remove participante da equipe (?participantId=). */
export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/prestador/appointments/[id]/participants">,
) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id } = await ctx.params;
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get("participantId");

    if (!participantId) {
      return NextResponse.json({ error: "Informe participantId" }, { status: 400 });
    }

    const removed = await removeAppointmentParticipant({
      participantId,
      appointmentId: id,
      tenantId: user.tenantId,
      providerId: user.id,
    });

    if (!removed) {
      return NextResponse.json({ error: "Participante não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
