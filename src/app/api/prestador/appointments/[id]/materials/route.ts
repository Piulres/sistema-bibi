import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { listMedicalProducts, registerStockMovement } from "@/lib/stock-service";

/** Lista produtos disponíveis para dispensação no atendimento. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/prestador/appointments/[id]/materials">,
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

    const products = await listMedicalProducts(user.tenantId);
    const available = products.filter((p) => p.active && p.totalStock > 0);

    const movements = await prisma.stockMovement.findMany({
      where: { tenantId: user.tenantId, appointmentId: id, type: "DISPENSACAO" },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      products: available,
      dispensations: movements.map((m) => ({
        id: m.id,
        productName: m.product.name,
        quantity: m.quantity,
        unit: m.product.unit,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

/** Dispensação manual de material no atendimento. */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/prestador/appointments/[id]/materials">,
) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id } = await ctx.params;
    const prisma = await getPrisma();
    const body = (await request.json()) as { productId?: string; quantity?: number };

    if (!body.productId || !body.quantity) {
      return NextResponse.json({ error: "Informe produto e quantidade" }, { status: 400 });
    }

    const appointment = await prisma.appointment.findFirst({
      where: { id, providerId: user.id, tenantId: user.tenantId },
      include: { patient: true },
    });
    if (!appointment) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    const result = await registerStockMovement({
      tenantId: user.tenantId,
      productId: body.productId,
      type: "DISPENSACAO",
      quantity: body.quantity,
      reason: `Dispensação no atendimento — ${appointment.patient.name}`,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      createdBy: user.id,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
