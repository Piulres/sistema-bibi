import { describe, expect, it } from "vitest";
import { resolveCareJourneyStep } from "@/lib/care-journey";

describe("care-journey", () => {
  it("inicia em agendado sem contexto", () => {
    expect(resolveCareJourneyStep({})).toBe("agendado");
  });

  it("avança para confirmado", () => {
    expect(resolveCareJourneyStep({ appointmentStatus: "CONFIRMADO" })).toBe("confirmado");
  });

  it("avança para realizado após atendimento", () => {
    expect(resolveCareJourneyStep({ appointmentStatus: "REALIZADO" })).toBe("realizado");
    expect(resolveCareJourneyStep({ hasUnbilledUsages: true })).toBe("realizado");
  });

  it("avança para faturado e pago", () => {
    expect(resolveCareJourneyStep({ hasOpenInvoice: true })).toBe("faturado");
    expect(resolveCareJourneyStep({ hasPaidInvoice: true })).toBe("pago");
  });
});
