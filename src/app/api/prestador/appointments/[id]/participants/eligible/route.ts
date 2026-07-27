import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { listEligibleTeamMembers } from "@/lib/appointment-team-service";
import { isTeamRole } from "@/lib/clinical/team-roles";

/** Profissionais elegíveis para um papel na equipe. */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/prestador/appointments/[id]/participants/eligible">,
) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id } = await ctx.params;
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    if (!role || !isTeamRole(role)) {
      return NextResponse.json({ error: "Informe um papel válido" }, { status: 400 });
    }

    const prisma = await getPrisma();
    const appointment = await prisma.appointment.findFirst({
      where: { id, providerId: user.id, tenantId: user.tenantId },
      include: { participants: { select: { userId: true } } },
    });
    if (!appointment) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    const excludeIds = [
      user.id,
      ...appointment.participants.map((p) => p.userId),
    ];

    const members = await listEligibleTeamMembers(user.tenantId, role, excludeIds);

    return NextResponse.json({ members });
  } catch (error) {
    return authErrorResponse(error);
  }
}
