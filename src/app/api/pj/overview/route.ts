import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { formatBRL } from "@/lib/pricing";

/**
 * Visao da empresa (PJ): contrato, beneficiarios vinculados e faturas
 * Pay Per Use geradas para a empresa.
 */
export async function GET() {
  try {
    const user = await requireUser(["PJ"]);
    if (!user.companyId) {
      return NextResponse.json({ error: "Usuário sem empresa vinculada" }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      include: {
        patients: {
          include: {
            appointments: { include: { usages: true } },
          },
          orderBy: { name: "asc" },
        },
        invoices: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const beneficiaries = company.patients.map((p) => {
      const usageCount = p.appointments.reduce((n, a) => n + a.usages.length, 0);
      const consumed = p.appointments.reduce(
        (sum, a) => sum + a.usages.reduce((s, u) => s + u.priceCharged, 0),
        0,
      );
      return {
        id: p.id,
        name: p.name,
        cpf: p.cpf,
        usageCount,
        consumed,
        consumedLabel: formatBRL(consumed),
      };
    });

    const totalConsumed = beneficiaries.reduce((sum, b) => sum + b.consumed, 0);

    return NextResponse.json({
      company: {
        name: company.name,
        cnpj: company.cnpj,
        contractActive: company.contractActive,
        beneficiariesCount: company.patients.length,
        totalConsumed,
        totalConsumedLabel: formatBRL(totalConsumed),
      },
      beneficiaries,
      invoices: company.invoices.map((inv) => ({
        id: inv.id,
        total: inv.total,
        totalLabel: formatBRL(inv.total),
        status: inv.status,
        createdAt: inv.createdAt,
      })),
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
