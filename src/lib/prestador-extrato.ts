import "server-only";
import { getPrisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";

function startOfMonth(date = new Date()): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

const dateLabel = (value: Date) =>
  value.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export type PrestadorExtratoData = {
  periodLabel: string;
  summary: {
    proceduresCount: number;
    revenueLabel: string;
    billedLabel: string;
    pendingLabel: string;
  };
  lines: {
    id: string;
    performedAtLabel: string;
    patientName: string;
    procedure: string;
    category: string;
    priceLabel: string;
    billed: boolean;
    invoiceStatus: string | null;
    appointmentDateLabel: string;
  }[];
};

export async function getPrestadorExtrato(
  tenantId: string,
  providerId: string,
  fromParam?: string,
  toParam?: string,
): Promise<PrestadorExtratoData> {
  const prisma = await getPrisma();
  const from = fromParam ? new Date(`${fromParam}T00:00:00`) : startOfMonth();
  const to = toParam ? endOfDay(new Date(`${toParam}T12:00:00`)) : endOfDay(new Date());

  const usages = await prisma.procedureUsage.findMany({
    where: {
      performedAt: { gte: from, lte: to },
      appointment: { tenantId, providerId },
    },
    include: {
      procedure: true,
      appointment: { include: { patient: { select: { name: true } } } },
      invoiceItem: { include: { invoice: { select: { status: true } } } },
    },
    orderBy: { performedAt: "desc" },
  });

  let billedTotal = 0;
  let pendingTotal = 0;

  const lines = usages.map((u) => {
    if (u.billed) billedTotal += u.priceCharged;
    else pendingTotal += u.priceCharged;

    return {
      id: u.id,
      performedAtLabel: dateLabel(u.performedAt),
      patientName: u.appointment.patient.name,
      procedure: u.procedure.name,
      category: u.procedure.category,
      priceLabel: formatBRL(u.priceCharged),
      billed: u.billed,
      invoiceStatus: u.invoiceItem?.invoice.status ?? null,
      appointmentDateLabel: dateLabel(u.appointment.scheduledAt),
    };
  });

  const periodLabel = `${from.toLocaleDateString("pt-BR")} — ${to.toLocaleDateString("pt-BR")}`;

  return {
    periodLabel,
    summary: {
      proceduresCount: usages.length,
      revenueLabel: formatBRL(billedTotal + pendingTotal),
      billedLabel: formatBRL(billedTotal),
      pendingLabel: formatBRL(pendingTotal),
    },
    lines,
  };
}
