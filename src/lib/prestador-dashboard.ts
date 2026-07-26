import "server-only";
import {
  APP_TIMEZONE,
  civilDateISO,
  endOfDayInAppTz,
  formatDateTimeBR,
  shiftCivilDate,
  startOfDayInAppTz,
} from "@/lib/timezone";
import { getPrisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";

const dateTime = (value: Date) => formatDateTimeBR(value);

function startOfToday(): Date {
  return startOfDayInAppTz();
}

function endOfToday(): Date {
  return endOfDayInAppTz();
}

/** Segunda-feira 00:00 no fuso da app (semana operacional). */
function startOfWeek(): Date {
  const todayISO = civilDateISO();
  // getDay() em UTC no instante de início do dia BRT: usar partes do meio-dia BRT.
  const noon = new Date(startOfDayInAppTz(todayISO).getTime() + 12 * 60 * 60 * 1000);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    weekday: "short",
  }).format(noon);
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const diff = map[weekday] ?? 0;
  return startOfDayInAppTz(shiftCivilDate(todayISO, -diff));
}

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
