import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { formatBRL } from "@/lib/pricing";

/** Detalhe de um agendamento: paciente, procedimentos usados e prontuario. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/prestador/appointments/[id]">,
) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id } = await ctx.params;

    const appointment = await prisma.appointment.findFirst({
      where: { id, providerId: user.id },
      include: {
        patient: { include: { company: true } },
        usages: { include: { procedure: true }, orderBy: { performedAt: "asc" } },
        medicalRecords: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      appointment: {
        id: appointment.id,
        scheduledAt: appointment.scheduledAt,
        status: appointment.status,
        reason: appointment.reason,
      },
      patient: {
        id: appointment.patient.id,
        name: appointment.patient.name,
        cpf: appointment.patient.cpf,
        company: appointment.patient.company?.name ?? null,
        companyId: appointment.patient.companyId,
      },
      usages: appointment.usages.map((u) => ({
        id: u.id,
        procedure: u.procedure.name,
        category: u.procedure.category,
        priceCharged: u.priceCharged,
        priceLabel: formatBRL(u.priceCharged),
        billed: u.billed,
      })),
      records: appointment.medicalRecords.map((r) => ({
        id: r.id,
        content: r.content,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

/** Atualiza o status do agendamento (ex.: marcar como REALIZADO). */
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/prestador/appointments/[id]">,
) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id } = await ctx.params;
    const body = (await request.json()) as { status?: string };

    const allowed = ["AGENDADO", "CONFIRMADO", "REALIZADO", "FALTOU", "CANCELADO"];
    if (!body.status || !allowed.includes(body.status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const existing = await prisma.appointment.findFirst({
      where: { id, providerId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    await prisma.appointment.update({
      where: { id },
      data: { status: body.status },
    });

    return NextResponse.json({ ok: true, status: body.status });
  } catch (error) {
    return authErrorResponse(error);
  }
}
