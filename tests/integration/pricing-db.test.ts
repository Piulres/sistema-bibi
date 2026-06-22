import { describe, expect, it } from "vitest";
import { getTestPrisma } from "../helpers/db";
import { computePrice } from "@/lib/pricing";

describe("computePrice (integração Prisma)", () => {
  const prisma = getTestPrisma();

  it("aplica multiplicador da empresa no Pay Per Use", async () => {
    const procedure = await prisma.procedure.findFirst({
      where: { code: "CON-CLM" },
    });
    expect(procedure).toBeTruthy();

    const rule = await prisma.pricingRule.findFirst({
      where: { procedureId: procedure!.id },
      include: { company: true },
    });
    expect(rule).toBeTruthy();

    const result = await computePrice(
      procedure!.id,
      rule!.companyId,
      procedure!.tenantId,
    );

    expect(result.multiplier).toBe(rule!.multiplier);
    expect(result.price).toBe(
      Math.round(procedure!.basePrice * rule!.multiplier * 100) / 100,
    );
  });

  it("isola procedimento por tenantId", async () => {
    const procedure = await prisma.procedure.findFirst();
    await expect(
      computePrice(procedure!.id, null, "tenant-inexistente"),
    ).rejects.toThrow(/não encontrado/i);
  });

  it("sem empresa usa preço base", async () => {
    const procedure = await prisma.procedure.findFirst();
    const result = await computePrice(procedure!.id, null, procedure!.tenantId);
    expect(result.multiplier).toBe(1);
    expect(result.price).toBe(procedure!.basePrice);
  });
});
