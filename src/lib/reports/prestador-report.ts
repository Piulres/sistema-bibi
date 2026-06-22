import "server-only";
import { getPrisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

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

export async function buildPrestadorProceduresCsv(
  tenantId: string,
  providerId: string,
  fromParam?: string,
  toParam?: string,
): Promise<string> {
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
    orderBy: { performedAt: "asc" },
  });

  const header = "data,paciente,procedimento,categoria,valor,faturado,status_fatura,data_consulta";
  const rows = usages.map((u) =>
    [
      u.performedAt.toISOString(),
      csvEscape(u.appointment.patient.name),
      csvEscape(u.procedure.name),
      csvEscape(u.procedure.category),
      formatBRL(u.priceCharged),
      u.billed ? "sim" : "nao",
      u.invoiceItem?.invoice.status ?? "",
      u.appointment.scheduledAt.toISOString(),
    ].join(","),
  );

  return [header, ...rows].join("\n");
}

export async function buildPrestadorAppointmentsCsv(
  tenantId: string,
  providerId: string,
  fromParam?: string,
  toParam?: string,
): Promise<string> {
  const prisma = await getPrisma();
  const from = fromParam ? new Date(`${fromParam}T00:00:00`) : startOfMonth();
  const to = toParam ? endOfDay(new Date(`${toParam}T12:00:00`)) : endOfDay(new Date());

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      providerId,
      scheduledAt: { gte: from, lte: to },
    },
    include: {
      patient: { select: { name: true } },
      usages: true,
    },
    orderBy: { scheduledAt: "asc" },
  });

  const header = "data,paciente,status,modalidade,procedimentos,valor_total";
  const rows = appointments.map((a) => {
    const total = a.usages.reduce((s, u) => s + u.priceCharged, 0);
    return [
      a.scheduledAt.toISOString(),
      csvEscape(a.patient.name),
      a.status,
      a.modality,
      String(a.usages.length),
      formatBRL(total),
    ].join(",");
  });

  return [header, ...rows].join("\n");
}
