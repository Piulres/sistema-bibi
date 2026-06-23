import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";

export async function GET(request: Request) {
  const prisma = await getPrisma();
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";

    const patients = await prisma.patient.findMany({
      where: {
        tenantId: user.tenantId,
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { cpf: { contains: q } },
              ],
            }
          : {}),
        appointments: { some: { providerId: user.id } },
      },
      select: {
        id: true,
        name: true,
        cpf: true,
        company: { select: { name: true } },
        _count: { select: { appointments: true } },
      },
      orderBy: { name: "asc" },
      take: 50,
    });

    return NextResponse.json({
      patients: patients.map((p) => ({
        id: p.id,
        name: p.name,
        cpf: p.cpf,
        company: p.company?.name ?? null,
        appointmentsCount: p._count.appointments,
      })),
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
