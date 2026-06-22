import "server-only";
import { getPrisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(): Date {
  const d = startOfToday();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

const dateTime = (value: Date) =>
  value.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export type PrestadorDashboardData = {
  generatedAtLabel: string;
  kpis: {
    appointmentsToday: number;
    confirmedToday: number;
    completedToday: number;
    pendingToday: number;
    teleToday: number;
    proceduresWeek: number;
    revenueWeekLabel: string;
    uniquePatients: number;
  };
  nextAppointment: {
    id: string;
    patientName: string;
    scheduledAtLabel: string;
    status: string;
    modality: string;
  } | null;
  todayQueue: {
    id: string;
    patientName: string;
    scheduledAtLabel: string;
    status: string;
    modality: string;
  }[];
};

/** KPIs operacionais do prestador logado. */
export async function getPrestadorDashboard(
  tenantId: string,
  providerId: string,
): Promise<PrestadorDashboardData> {
  const prisma = await getPrisma();
  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const weekStart = startOfWeek();

  const baseWhere = { tenantId, providerId };

  const todayAppointments = await prisma.appointment.findMany({
    where: {
      ...baseWhere,
      scheduledAt: { gte: todayStart, lte: todayEnd },
      status: { not: "CANCELADO" },
    },
    orderBy: { scheduledAt: "asc" },
    include: { patient: { select: { id: true, name: true } } },
  });

  const [proceduresWeek, uniquePatients] = await Promise.all([
    prisma.procedureUsage.findMany({
      where: {
        performedAt: { gte: weekStart },
        appointment: baseWhere,
      },
      select: { priceCharged: true },
    }),
    prisma.appointment.findMany({
      where: baseWhere,
      select: { patientId: true },
      distinct: ["patientId"],
    }),
  ]);

  const confirmedToday = todayAppointments.filter((a) => a.status === "CONFIRMADO").length;
  const completedToday = todayAppointments.filter((a) => a.status === "REALIZADO").length;
  const pendingToday = todayAppointments.filter(
    (a) => a.status === "AGENDADO" || a.status === "CONFIRMADO",
  ).length;
  const teleToday = todayAppointments.filter((a) => a.modality === "TELE").length;

  const revenueWeek = proceduresWeek.reduce((sum, u) => sum + u.priceCharged, 0);

  const next = todayAppointments.find(
    (a) => a.status === "AGENDADO" || a.status === "CONFIRMADO",
  );

  return {
    generatedAtLabel: dateTime(new Date()),
    kpis: {
      appointmentsToday: todayAppointments.length,
      confirmedToday,
      completedToday,
      pendingToday,
      teleToday,
      proceduresWeek: proceduresWeek.length,
      revenueWeekLabel: formatBRL(revenueWeek),
      uniquePatients: uniquePatients.length,
    },
    nextAppointment: next
      ? {
          id: next.id,
          patientName: next.patient.name,
          scheduledAtLabel: dateTime(next.scheduledAt),
          status: next.status,
          modality: next.modality,
        }
      : null,
    todayQueue: todayAppointments.map((a) => ({
      id: a.id,
      patientName: a.patient.name,
      scheduledAtLabel: dateTime(a.scheduledAt),
      status: a.status,
      modality: a.modality,
    })),
  };
}
