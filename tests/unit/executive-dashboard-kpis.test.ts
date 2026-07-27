import { describe, expect, it } from "vitest";
import { summarizeInvoiceMoney } from "@/lib/executive-dashboard-kpis";

describe("summarizeInvoiceMoney", () => {
  it("separa a receber, recebido e emitido (cenário CEDIG TZ Final)", () => {
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

  it("conta FECHADA/ABERTA em a receber e ignora ANULADA", () => {
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

  it("lista vazia zera todos os eixos", () => {
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
