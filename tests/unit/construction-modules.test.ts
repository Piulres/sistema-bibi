import { describe, expect, it } from "vitest";
import {
  applyBdi,
  calculateAreas,
  lineItemDirectCost,
  simulateBdiCoverage,
  sumBdiPercent,
} from "@/lib/project/construction-modules";

describe("construction-modules", () => {
  it("calcula áreas de ambiente", () => {
    const areas = calculateAreas(5, 4, 2.8);
    expect(areas.floorArea).toBe(20);
    expect(areas.ceilingArea).toBe(20);
    expect(areas.wallArea).toBeCloseTo(50.4, 1);
  });

  it("soma BDI decomposto", () => {
    expect(
      sumBdiPercent({ administration: 5, risk: 3, profit: 10, taxes: 5, financial: 2 }),
    ).toBe(25);
  });

  it("aplica BDI sobre subtotal", () => {
    expect(applyBdi(100000, 25)).toBe(125000);
  });

  it("calcula custo direto de item", () => {
    expect(lineItemDirectCost(80, 120, 10)).toBe(2000);
  });

  it("simula cobertura BDI", () => {
    const result = simulateBdiCoverage({
      directCost: 100000,
      indirectCosts: 15000,
      targetProfit: 20000,
    });
    expect(result.salePrice).toBe(135000);
    expect(result.requiredBdiPercent).toBe(35);
  });
});
