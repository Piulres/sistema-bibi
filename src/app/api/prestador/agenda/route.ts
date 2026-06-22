import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";

const LIMIT = 60;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

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
    scheduledAt: a.scheduledAt,
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
  try {
    const user = await requireUser(["PRESTADOR"]);
    const url = new URL(request.url);
    const view = url.searchParams.get("view") ?? "day";
    const dateParam = url.searchParams.get("date");

    const today = startOfDay(new Date());
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
          scheduledAt: { gte: today, lte: endOfDay(today) },
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

    const day = dateParam ? new Date(`${dateParam}T12:00:00`) : new Date();
    const start = startOfDay(day);
    const end = endOfDay(day);

    const appointments = await prisma.appointment.findMany({
      where: { ...baseWhere, scheduledAt: { gte: start, lte: end } },
      orderBy: { scheduledAt: "asc" },
      include,
    });

    return NextResponse.json({
      view: "day",
      date: start.toISOString().slice(0, 10),
      appointments: appointments.map(mapAppointment),
      summary,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
