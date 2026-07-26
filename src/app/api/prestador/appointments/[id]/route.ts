import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { formatBRL } from "@/lib/pricing";
import {
  canTransitionAppointmentStatus,
  isAppointmentStatus,
} from "@/lib/appointment-status";
import {
  recordTimelineEvent,
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "@/lib/timeline";

/** Detalhe de um agendamento: paciente, procedimentos usados e prontuario. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/prestador/appointments/[id]">,
) {
  const prisma = await getPrisma();
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id } = await ctx.params;

    const appointment = await prisma.appointment.findFirst({
      where: { id, providerId: user.id, tenantId: user.tenantId },
      include: {
        patient: { include: { company: true } },
        pet: { select: { id: true, name: true, species: true, breed: true } },
        usages: {
          include: {
            procedure: true,
            invoiceItem: { include: { invoice: { select: { id: true, status: true } } } },
          },
          orderBy: { performedAt: "asc" },
        },
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
      pet: appointment.pet
        ? {
            id: appointment.pet.id,
            name: appointment.pet.name,
            species: appointment.pet.species,
            breed: appointment.pet.breed,
          }
        : null,
      usages: appointment.usages.map((u) => ({
        id: u.id,
        procedure: u.procedure.name,
        category: u.procedure.category,
        priceCharged: u.priceCharged,
        priceLabel: formatBRL(u.priceCharged),
        billed: u.billed,
        invoiceId: u.invoiceItem?.invoice?.id ?? null,
        invoiceStatus: u.invoiceItem?.invoice?.status ?? null,
      })),
      records: appointment.medicalRecords.map((r) => ({
        id: r.id,
        content: r.content,
        recordType: r.recordType,
        title: r.title,
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
  const prisma = await getPrisma();
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id } = await ctx.params;
    const body = (await request.json()) as { status?: string };

    if (!body.status || !isAppointmentStatus(body.status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const existing = await prisma.appointment.findFirst({
      where: { id, providerId: user.id, tenantId: user.tenantId },
      include: { patient: { select: { name: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    if (!canTransitionAppointmentStatus(existing.status, body.status)) {
      return NextResponse.json(
        { error: `Transição de status inválida: ${existing.status} → ${body.status}` },
        { status: 409 },
      );
    }

    await prisma.appointment.update({
      where: { id },
      data: { status: body.status },
    });

    await recordTimelineEvent({
      tenantId: existing.tenantId,
      entityType: TIMELINE_ENTITY_TYPES.APPOINTMENT,
      entityId: existing.id,
      action: TIMELINE_ACTIONS.UPDATED,
      description: `Status do atendimento de ${existing.patient.name} alterado para ${body.status}`,
      createdBy: user.id,
    });

    if (body.status === "REALIZADO") {
      await recordTimelineEvent({
        tenantId: existing.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.APPOINTMENT,
        entityId: existing.id,
        action: TIMELINE_ACTIONS.APPOINTMENT_COMPLETED,
        description: `Atendimento de ${existing.patient.name} realizado`,
        createdBy: user.id,
      });
    }

    return NextResponse.json({ ok: true, status: body.status });
  } catch (error) {
    return authErrorResponse(error);
  }
}
