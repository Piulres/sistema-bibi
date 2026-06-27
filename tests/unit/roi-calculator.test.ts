import { describe, expect, it } from "vitest";
import {
  ROI_SEGMENT_PRESETS,
  computeRoi,
  parseRoiSegmentKey,
} from "@/lib/landing/roi-calculator";
import { resolveHomeHeroVariant } from "@/lib/landing/hero-variants";

describe("roi-calculator", () => {
  it("calcula cenário canônico saúde (500 vidas, 15%)", () => {
    const preset = ROI_SEGMENT_PRESETS.MEDICAL;
    const result = computeRoi({
      eligible: 500,
      utilizationPct: 15,
      traditionalTicket: preset.traditionalTicket,
      unitPrice: preset.unitPrice,
      platformFee: preset.platformFee,
    });

    expect(result.unitsPerMonth).toBe(75);
    expect(result.traditionalMonthly).toBe(175_000);
    expect(result.variablePpu).toBe(20_400);
    expect(result.ppuTotal).toBe(23_400);
    expect(result.savingsMonthly).toBe(151_600);
    expect(result.savingsPct).toBeCloseTo(86.6, 1);
  });

  it("retorna economia zero quando PPU é mais caro", () => {
    const result = computeRoi({
      eligible: 10,
      utilizationPct: 100,
      traditionalTicket: 50,
      unitPrice: 500,
      platformFee: 5000,
    });

    expect(result.savingsMonthly).toBe(0);
    expect(result.savingsPct).toBe(0);
  });

  it("parseia slugs de segmento para hero e calculadora", () => {
    expect(parseRoiSegmentKey("vet")).toBe("VET");
    expect(parseRoiSegmentKey("saude")).toBe("MEDICAL");
    expect(parseRoiSegmentKey("unknown")).toBeNull();
  });
});

describe("hero-variants", () => {
  it("usa hero padrão sem parâmetro", () => {
    const variant = resolveHomeHeroVariant(null);
    expect(variant.segment).toBe("default");
  });

  it("personaliza hero para segmento jurídico", () => {
    const variant = resolveHomeHeroVariant("legal");
    expect(variant.segment).toBe("LEGAL");
    expect(variant.headlineAccent).toMatch(/horas/i);
  });
});
