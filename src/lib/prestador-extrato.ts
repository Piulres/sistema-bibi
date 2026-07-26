import "server-only";
import { getPrisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import {
  civilDateISO,
  endOfDayInAppTz,
  formatDateTimeBR,
  startOfDayInAppTz,
  zonedDateTimeToUtc,
} from "@/lib/timezone";

function startOfMonth(date = new Date()): Date {
  const iso = civilDateISO(date);
  const [year, month] = iso.split("-").map(Number);
  return zonedDateTimeToUtc({ year, month, day: 1, hour: 0, minute: 0, second: 0 });
}

const dateLabel = (value: Date) => formatDateTimeBR(value);

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
  const from = fromParam ? startOfDayInAppTz(fromParam) : startOfMonth();
  const to = toParam ? endOfDayInAppTz(toParam) : endOfDayInAppTz();

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
