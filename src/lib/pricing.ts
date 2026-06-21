import { prisma } from "@/lib/db";

/**
 * Calcula o preco efetivo de um procedimento para um beneficiario, aplicando
 * a precificacao dinamica (regras por empresa). Nucleo da transparencia
 * previa de valores do modelo Pay Per Use.
 */
export async function computePrice(
  procedureId: string,
  companyId: string | null,
): Promise<{ basePrice: number; multiplier: number; price: number }> {
  const procedure = await prisma.procedure.findUnique({
    where: { id: procedureId },
  });
  if (!procedure) {
    throw new Error("Procedimento não encontrado");
  }

  let multiplier = 1;
  if (companyId) {
    const rule = await prisma.pricingRule.findFirst({
      where: { procedureId, companyId },
    });
    if (rule) {
      multiplier = rule.multiplier;
    }
  }

  const price = Math.round(procedure.basePrice * multiplier * 100) / 100;
  return { basePrice: procedure.basePrice, multiplier, price };
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
