import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { formatBRL } from "@/lib/pricing";

/** Catalogo de procedimentos do tenant (consultas e exames). */
export async function GET() {
  const prisma = await getPrisma();
  try {
    const user = await requireUser(["PRESTADOR", "INTERNO"]);

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
      })),
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
