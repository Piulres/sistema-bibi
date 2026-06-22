import { describe, expect, it } from "vitest";
import { computeUpcomingDueDates } from "@/lib/subscription";

describe("subscription.computeUpcomingDueDates", () => {
  it("gera vencimentos mensais a partir da data de início", () => {
    const start = new Date("2026-01-15");
    const dates = computeUpcomingDueDates({
      billingCycle: "MENSAL",
      startDate: start,
      endDate: null,
      horizonMonths: 3,
    });

    expect(dates.length).toBeGreaterThan(0);
    for (const d of dates) {
      expect(d.getDate()).toBe(15);
    }
  });

  it("não duplica datas já existentes", () => {
    const start = new Date("2026-01-15");
    const existing = [new Date("2026-02-15")];
    const dates = computeUpcomingDueDates({
      billingCycle: "MENSAL",
      startDate: start,
      endDate: null,
      horizonMonths: 6,
      existingDueDates: existing,
    });

    const keys = dates.map((d) => d.toISOString().slice(0, 10));
    expect(keys).not.toContain("2026-02-15");
  });

  it("respeita data de término da assinatura", () => {
    const start = new Date("2026-01-01");
    const end = new Date("2026-03-01");
    const dates = computeUpcomingDueDates({
      billingCycle: "MENSAL",
      startDate: start,
      endDate: end,
      horizonMonths: 12,
    });

    for (const d of dates) {
      expect(d <= end).toBe(true);
    }
  });

  it("ciclo trimestral avança 3 meses", () => {
    const start = new Date("2026-01-10");
    const dates = computeUpcomingDueDates({
      billingCycle: "TRIMESTRAL",
      startDate: start,
      endDate: null,
      horizonMonths: 12,
    });

    if (dates.length >= 2) {
      const diff =
        (dates[1].getFullYear() - dates[0].getFullYear()) * 12 +
        (dates[1].getMonth() - dates[0].getMonth());
      expect(diff).toBe(3);
    }
  });
});
