import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { formatBRL } from "@/lib/pricing";
import { isPaymentGatewayConfigured } from "@/lib/payments/charge-service";

/**
 * Painel de faturamento: procedimentos utilizados ainda nao faturados,
 * agrupados por paciente, e faturas ja emitidas.
 */
export async function GET() {
  const prisma = await getPrisma();
  try {
    const user = await requireUser(["INTERNO"]);

    const pendingUsages = await prisma.procedureUsage.findMany({
      where: {
        billed: false,
        appointment: { tenantId: user.tenantId },
      },
      include: {
        procedure: true,
        appointment: { include: { patient: { include: { company: true } } } },
      },
      orderBy: { performedAt: "asc" },
    });

    // Agrupa por paciente.
    const groups = new Map<
      string,
      {
        patientId: string;
        patientName: string;
        company: string | null;
        total: number;
        items: { id: string; procedure: string; priceLabel: string }[];
      }
    >();

    for (const u of pendingUsages) {
      const patient = u.appointment.patient;
      const g = groups.get(patient.id) ?? {
        patientId: patient.id,
        patientName: patient.name,
        company: patient.company?.name ?? null,
        total: 0,
        items: [],
      };
      g.total += u.priceCharged;
      g.items.push({ id: u.id, procedure: u.procedure.name, priceLabel: formatBRL(u.priceCharged) });
      groups.set(patient.id, g);
    }

    const invoices = await prisma.invoice.findMany({
      where: { tenantId: user.tenantId },
      include: { patient: true, company: true, items: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      pending: Array.from(groups.values()).map((g) => ({
        ...g,
        totalLabel: formatBRL(g.total),
      })),
      invoices: invoices.map((inv) => ({
        id: inv.id,
        patientId: inv.patientId,
        patientName: inv.patient.name,
        company: inv.company?.name ?? null,
        total: inv.total,
        totalLabel: formatBRL(inv.total),
        status: inv.status,
        itemsCount: inv.items.length,
        createdAt: inv.createdAt,
      })),
      paymentGatewayConfigured: isPaymentGatewayConfigured(),
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
