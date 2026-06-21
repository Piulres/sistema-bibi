import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { formatBRL } from "@/lib/pricing";

/**
 * Gera uma fatura Pay Per Use para um paciente, agregando todos os
 * procedimentos utilizados e ainda nao faturados. Fluxo "fechado na alta".
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser(["INTERNO"]);
    const body = (await request.json()) as { patientId?: string };

    if (!body.patientId) {
      return NextResponse.json({ error: "Informe o paciente" }, { status: 400 });
    }

    const patient = await prisma.patient.findFirst({
      where: { id: body.patientId, tenantId: user.tenantId },
    });
    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    const usages = await prisma.procedureUsage.findMany({
      where: {
        billed: false,
        appointment: { patientId: patient.id, tenantId: user.tenantId },
      },
      include: { procedure: true },
    });

    if (usages.length === 0) {
      return NextResponse.json(
        { error: "Não há procedimentos pendentes para este paciente" },
        { status: 400 },
      );
    }

    const total = usages.reduce((sum, u) => sum + u.priceCharged, 0);

    const invoice = await prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          tenantId: user.tenantId,
          patientId: patient.id,
          companyId: patient.companyId,
          total,
          status: "FECHADA",
          items: {
            create: usages.map((u) => ({
              description: u.procedure.name,
              amount: u.priceCharged,
              usageId: u.id,
            })),
          },
        },
        include: { items: true },
      });

      await tx.procedureUsage.updateMany({
        where: { id: { in: usages.map((u) => u.id) } },
        data: { billed: true },
      });

      return created;
    });

    return NextResponse.json({
      invoice: {
        id: invoice.id,
        total: invoice.total,
        totalLabel: formatBRL(invoice.total),
        status: invoice.status,
        itemsCount: invoice.items.length,
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
