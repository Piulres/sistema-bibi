import { describe, expect, it } from "vitest";
import {
  OPERATION_MONTH_MARKER,
  OPERATION_MONTH_FUTURE_DAYS,
  OPERATION_MONTH_PAST_DAYS,
  buildOperationMonthPlan,
  operationMonthWindow,
} from "../../prisma/seed-data/operation-month-plan";

describe("Plano do mês operacional (puro)", () => {
  const fixedNow = new Date("2026-07-15T12:00:00");

  it("cobre janela relativa de ~30 dias com slots densos", () => {
    const plan = buildOperationMonthPlan(fixedNow);
    expect(plan.marker).toBe(OPERATION_MONTH_MARKER);
    expect(plan.pastDays).toBe(OPERATION_MONTH_PAST_DAYS);
    expect(plan.futureDays).toBe(OPERATION_MONTH_FUTURE_DAYS);
    // ~25 dias úteis × 3 + sábados ≈ 70+
    expect(plan.slots.length).toBeGreaterThanOrEqual(60);
    expect(plan.slots.every((s) => s.reasonLabel.includes(OPERATION_MONTH_MARKER))).toBe(true);
  });

  it("mistura fontes, médicos (via salt), status e modalidades", () => {
    const plan = buildOperationMonthPlan(fixedNow);
    const sources = new Set(plan.slots.map((s) => s.source));
    expect(sources.has("WALK_IN")).toBe(true);
    expect(sources.has("CORPORATE")).toBe(true);
    expect(sources.has("SELF_SERVICE")).toBe(true);
    expect(sources.has("PARTICULAR")).toBe(true);

    const statuses = new Set(plan.slots.map((s) => s.status));
    expect(statuses.has("REALIZADO")).toBe(true);
    expect(statuses.has("FALTOU")).toBe(true);
    expect(statuses.has("CANCELADO")).toBe(true);
    expect(statuses.has("AGENDADO")).toBe(true);

    expect(plan.slots.some((s) => s.modality === "TELE")).toBe(true);
    expect(plan.slots.some((s) => s.dispenseStock)).toBe(true);
    expect(plan.slots.some((s) => s.withPep && s.status === "REALIZADO")).toBe(true);
    expect(plan.slots.some((s) => s.invoiceStatus === "PAGA")).toBe(true);
  });

  it("futuro não tem REALIZADO; passado não tem só AGENDADO/CONFIRMADO sem variação", () => {
    const plan = buildOperationMonthPlan(fixedNow);
    const future = plan.slots.filter((s) => s.dayOffset > 0);
    const past = plan.slots.filter((s) => s.dayOffset < 0);
    expect(future.length).toBeGreaterThan(0);
    expect(future.every((s) => s.status === "AGENDADO" || s.status === "CONFIRMADO")).toBe(
      true,
    );
    expect(past.some((s) => s.status === "REALIZADO")).toBe(true);
    expect(past.every((s) => s.status !== "AGENDADO" && s.status !== "CONFIRMADO")).toBe(true);
  });

  it("CEDIG: launches com tabelas/pagamentos diversos + despesas semanais", () => {
    const plan = buildOperationMonthPlan(fixedNow);
    expect(plan.cedigLaunches.length).toBeGreaterThanOrEqual(8);
    const tables = new Set(plan.cedigLaunches.map((l) => l.priceTable));
    expect(tables.size).toBeGreaterThanOrEqual(3);
    expect(plan.cedigLaunches.some((l) => l.paymentMethod === "PIX")).toBe(true);
    expect(plan.cedigLaunches.some((l) => l.paymentMethod === "CONVENIO")).toBe(true);
    expect(plan.cedigExpenses.length).toBe(8);
  });

  it("operationMonthWindow alinha from/to com offsets do plano", () => {
    const { from, to } = operationMonthWindow(fixedNow);
    expect(from.getTime()).toBeLessThan(fixedNow.getTime());
    expect(to.getTime()).toBeGreaterThan(fixedNow.getTime());
    const spanDays = (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
    expect(spanDays).toBeGreaterThanOrEqual(OPERATION_MONTH_PAST_DAYS);
    expect(spanDays).toBeLessThanOrEqual(OPERATION_MONTH_PAST_DAYS + OPERATION_MONTH_FUTURE_DAYS + 2);
  });
});
