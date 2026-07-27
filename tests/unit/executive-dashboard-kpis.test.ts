import { describe, expect, it } from "vitest";
import { summarizeInvoiceMoney } from "@/lib/executive-dashboard-kpis";

describe("KPIs de cobrança — A receber / Recebido / Emitido sem misturar eixos", () => {
  it("duas faturas PAGA (R$500 + R$1.451) somam só em Recebido, A receber fica zero", () => {
    const summary = summarizeInvoiceMoney([
      { total: 500, status: "PAGA" },
      { total: 1451, status: "PAGA" },
    ]);

    expect(summary.open).toBe(0);
    expect(summary.openCount).toBe(0);
    expect(summary.paid).toBe(1951);
    expect(summary.paidCount).toBe(2);
    expect(summary.emitted).toBe(1951);
    expect(summary.emittedCount).toBe(2);
  });

  it("FECHADA/ABERTA entram em A receber; ANULADA não infla Emitido", () => {
    const summary = summarizeInvoiceMoney([
      { total: 200, status: "FECHADA" },
      { total: 50, status: "ABERTA" },
      { total: 999, status: "ANULADA" },
      { total: 100, status: "PAGA" },
    ]);

    expect(summary.open).toBe(250);
    expect(summary.openCount).toBe(2);
    expect(summary.paid).toBe(100);
    expect(summary.emitted).toBe(350);
    expect(summary.emittedCount).toBe(3);
  });

  it("lista vazia zera todos os eixos (dashboard sem faturas)", () => {
    expect(summarizeInvoiceMoney([])).toEqual({
      open: 0,
      openCount: 0,
      paid: 0,
      paidCount: 0,
      emitted: 0,
      emittedCount: 0,
    });
  });
});
