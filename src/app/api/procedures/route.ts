import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { formatBRL } from "@/lib/pricing";
import { parseTeamRoleRequirements } from "@/lib/clinical/team-roles";

/** Catalogo de procedimentos do tenant (consultas e exames). */
export async function GET() {
  const prisma = await getPrisma();
  try {
    const user = await requireUser(["PRESTADOR", "INTERNO", "BENEFICIARIO", "PJ"]);

    const procedures = await prisma.procedure.findMany({
      where: { tenantId: user.tenantId },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      procedures: procedures.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        category: p.category,
        basePrice: p.basePrice,
        basePriceLabel: formatBRL(p.basePrice),
        teamRequirements: parseTeamRoleRequirements(p.requiredTeamRoles),
      })),
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
