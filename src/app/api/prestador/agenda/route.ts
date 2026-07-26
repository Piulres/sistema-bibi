import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import {
  civilDateISO,
  dayRangeInAppTz,
  endOfDayInAppTz,
  startOfDayInAppTz,
} from "@/lib/timezone";

const LIMIT = 60;

function mapAppointment(a: {
  id: string;
  scheduledAt: Date;
  status: string;
  modality: string;
  reason: string | null;
  patient: { id: string; name: string; company: { name: string } | null };
  usages: unknown[];
}) {
  return {
    id: a.id,
    scheduledAt: a.scheduledAt.toISOString(),
    status: a.status,
    modality: a.modality,
    reason: a.reason,
    patient: {
      id: a.patient.id,
      name: a.patient.name,
      company: a.patient.company?.name ?? null,
    },
    proceduresCount: a.usages.length,
  };
}

export async function GET(request: Request) {
  const prisma = await getPrisma();
  try {
    const user = await requireUser(["PRESTADOR"]);
    const url = new URL(request.url);
    const view = url.searchParams.get("view") ?? "day";
    const dateParam = url.searchParams.get("date");

    const today = startOfDayInAppTz();
    const include = {
      patient: { include: { company: true } },
      usages: { include: { procedure: true } },
    } as const;

    const baseWhere = { providerId: user.id, tenantId: user.tenantId };

    const [upcomingCount, pastCount, todayCount] = await Promise.all([
      prisma.appointment.count({
        where: { ...baseWhere, scheduledAt: { gte: today }, status: { not: "CANCELADO" } },
      }),
      prisma.appointment.count({
        where: { ...baseWhere, scheduledAt: { lt: today } },
      }),
      prisma.appointment.count({
        where: {
          ...baseWhere,
          scheduledAt: { gte: today, lte: endOfDayInAppTz() },
        },
      }),
    ]);

    const summary = { today: todayCount, upcoming: upcomingCount, past: pastCount };

    if (view === "upcoming") {
      const appointments = await prisma.appointment.findMany({
        where: {
          ...baseWhere,
          scheduledAt: { gte: today },
          status: { not: "CANCELADO" },
        },
        orderBy: { scheduledAt: "asc" },
        take: LIMIT,
        include,
      });

      return NextResponse.json({
        view: "upcoming",
        appointments: appointments.map(mapAppointment),
        summary,
      });
    }

    if (view === "past") {
      const appointments = await prisma.appointment.findMany({
        where: { ...baseWhere, scheduledAt: { lt: today } },
        orderBy: { scheduledAt: "desc" },
        take: LIMIT,
        include,
      });

      return NextResponse.json({
        view: "past",
        appointments: appointments.map(mapAppointment),
        summary,
      });
    }

    const { from: start, to: end, dateISO } = dayRangeInAppTz(dateParam ?? civilDateISO());

    const appointments = await prisma.appointment.findMany({
      where: { ...baseWhere, scheduledAt: { gte: start, lte: end } },
      orderBy: { scheduledAt: "asc" },
      include,
    });

    return NextResponse.json({
      view: "day",
      date: dateISO,
      appointments: appointments.map(mapAppointment),
      summary,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
