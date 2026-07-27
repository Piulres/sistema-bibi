import { describe, expect, it } from "vitest";
import { summarizeClinicMonthStrip } from "@/lib/clinic-finance/month-strip";

describe("Faixa de KPIs da gestão clínica — resumo sem round-trip /kpis", () => {
  it("soma receita, despesas e lucro para a faixa superior atualizar ao lançar", () => {
    const strip = summarizeClinicMonthStrip({
      launches: [
        { amountReceived: 750 },
        { amountReceived: 1450 },
      ],
      expenses: [{ amount: 300 }, { amount: 200 }],
    });
    expect(strip.examCount).toBe(2);
    expect(strip.revenue).toBe(2200);
    expect(strip.totalExpenses).toBe(500);
    expect(strip.operatingProfit).toBe(1700);
    expect(strip.averageTicket).toBe(1100);
  });

  it("ticket médio fica zero sem exames para não dividir por zero na faixa", () => {
    const strip = summarizeClinicMonthStrip({
      launches: [],
      expenses: [{ amount: 100 }],
    });
    expect(strip.examCount).toBe(0);
    expect(strip.averageTicket).toBe(0);
    expect(strip.operatingProfit).toBe(-100);
  });
});
