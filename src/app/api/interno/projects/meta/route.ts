import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { listCompanies } from "@/lib/company-service";
import { getPrisma } from "@/lib/db";
import { listProviders } from "@/lib/appointment-service";

export async function GET() {
  try {
    const user = await requireInternoModule("projetos");
    const prisma = await getPrisma();
    const [companies, providers, managers] = await Promise.all([
      listCompanies(user.tenantId),
      listProviders(user.tenantId),
      prisma.user.findMany({
        where: { tenantId: user.tenantId, role: { in: ["PRESTADOR", "INTERNO"] } },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      companies: companies.map((c) => ({ id: c.id, name: c.name })),
      providers,
      managers,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
