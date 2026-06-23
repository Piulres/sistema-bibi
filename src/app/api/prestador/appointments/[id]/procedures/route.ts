import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { computePrice, formatBRL } from "@/lib/pricing";
import {
  recordTimelineEvent,
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "@/lib/timeline";
import { consumeProcedureKit } from "@/lib/stock-service";

/**
 * Registra o uso de um procedimento no agendamento (Pay Per Use).
 * O preco e calculado com a precificacao dinamica e congelado no uso.
 */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/prestador/appointments/[id]/procedures">,
) {
  const prisma = await getPrisma();
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id } = await ctx.params;
    const body = (await request.json()) as { procedureId?: string };

    if (!body.procedureId) {
      return NextResponse.json({ error: "Informe o procedimento" }, { status: 400 });
    }

    const appointment = await prisma.appointment.findFirst({
      where: { id, providerId: user.id, tenantId: user.tenantId },
      include: { patient: true },
    });
    if (!appointment) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    const { price } = await computePrice(
      body.procedureId,
      appointment.patient.companyId,
      user.tenantId,
    );

    const usage = await prisma.procedureUsage.create({
      data: {
        appointmentId: appointment.id,
        procedureId: body.procedureId,
        priceCharged: price,
      },
      include: { procedure: true },
    });

    await recordTimelineEvent({
      tenantId: appointment.tenantId,
      entityType: TIMELINE_ENTITY_TYPES.PROCEDURE_USAGE,
      entityId: usage.id,
      action: TIMELINE_ACTIONS.PROCEDURE_REGISTERED,
      description: `${usage.procedure.name} registrado para ${appointment.patient.name} (${formatBRL(usage.priceCharged)})`,
      createdBy: user.id,
    });

    const kitResult = await consumeProcedureKit({
      tenantId: appointment.tenantId,
      procedureId: body.procedureId,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      procedureUsageId: usage.id,
      createdBy: user.id,
    });

    return NextResponse.json({
      usage: {
        id: usage.id,
        procedure: usage.procedure.name,
        category: usage.procedure.category,
        priceCharged: usage.priceCharged,
        priceLabel: formatBRL(usage.priceCharged),
      },
      stockConsumed: kitResult.consumed,
      stockWarnings: kitResult.warnings,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
