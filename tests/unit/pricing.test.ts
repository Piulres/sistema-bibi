import { describe, expect, it } from "vitest";
import { formatBRL } from "@/lib/pricing";

describe("pricing.formatBRL", () => {
  it("formata valores em Real brasileiro", () => {
    expect(formatBRL(150)).toMatch(/150/);
    expect(formatBRL(1500.5)).toMatch(/1\.?500,50|1,500\.50/);
  });

  it("trata zero", () => {
    expect(formatBRL(0)).toMatch(/0/);
  });
});
