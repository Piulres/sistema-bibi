import { describe, expect, it } from "vitest";
import {
  isStockProductCategory,
  isStockReversibleType,
  isStockSyntheticLot,
  isStockUnit,
  STOCK_NO_LOT_NUMBER,
  STOCK_PRODUCT_CATEGORIES,
  STOCK_UNITS,
} from "@/lib/stock-constants";

describe("Constantes de estoque — taxonomia multi-nicho e reversão", () => {
  it("aceita SERVICO/KIT/SC/M3 para seeds nicho sem rejeitar na API", () => {
    expect(STOCK_PRODUCT_CATEGORIES).toContain("SERVICO");
    expect(isStockProductCategory("SERVICO")).toBe(true);
    expect(isStockUnit("KIT")).toBe(true);
    expect(isStockUnit("SC")).toBe(true);
    expect(isStockUnit("M3")).toBe(true);
    expect(STOCK_UNITS).toEqual(
      expect.arrayContaining(["UN", "ML", "CX", "PC", "FR", "KIT", "SC", "M3"]),
    );
  });

  it("marca tipos operacionais como reversíveis e rejeita desconhecidos", () => {
    expect(isStockReversibleType("SAIDA")).toBe(true);
    expect(isStockReversibleType("ENTRADA")).toBe(true);
    expect(isStockReversibleType("DISPENSACAO")).toBe(true);
    expect(isStockReversibleType("FOO")).toBe(false);
  });

  it("identifica lote sintético SEM-LOTE usado quando requiresLot=false", () => {
    expect(STOCK_NO_LOT_NUMBER).toBe("SEM-LOTE");
    expect(isStockSyntheticLot("SEM-LOTE")).toBe(true);
    expect(isStockSyntheticLot("sem-lote")).toBe(true);
    expect(isStockSyntheticLot("LOT-001")).toBe(false);
  });
});
