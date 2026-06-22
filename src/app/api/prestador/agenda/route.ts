import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";

export async function GET() {
  const prisma = await getPrisma();
  try {
    const user = await requireUser(["PRESTADOR"]);

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        providerId: user.id,
        scheduledAt: { gte: start, lte: end },
      },
      orderBy: { scheduledAt: "asc" },
      include: {
        patient: { include: { company: true } },
        usages: { include: { procedure: true } },
      },
    });

    return NextResponse.json({
      appointments: appointments.map((a) => ({
        id: a.id,
        scheduledAt: a.scheduledAt,
        status: a.status,
        reason: a.reason,
        patient: {
          id: a.patient.id,
          name: a.patient.name,
          company: a.patient.company?.name ?? null,
        },
        proceduresCount: a.usages.length,
      })),
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
