import { describe, expect, it } from "vitest";
import {
  deriveCareJourneyBilling,
  resolveCareJourneyStep,
} from "@/lib/care-journey";

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

  it("pago tem prioridade sobre REALIZADO (bug do stepper no prestador)", () => {
    expect(
      resolveCareJourneyStep({
        appointmentStatus: "REALIZADO",
        hasUnbilledUsages: false,
        hasOpenInvoice: false,
        hasPaidInvoice: true,
      }),
    ).toBe("pago");
  });
});

describe("deriveCareJourneyBilling", () => {
  it("detecta fatura paga vinculada ao usage", () => {
    const flags = deriveCareJourneyBilling({
      usages: [{ billed: true, invoiceStatus: "PAGA" }],
    });
    expect(flags).toEqual({
      hasUnbilledUsages: false,
      hasOpenInvoice: false,
      hasPaidInvoice: true,
    });
    expect(resolveCareJourneyStep({ appointmentStatus: "REALIZADO", ...flags })).toBe("pago");
  });

  it("detecta fatura em aberto", () => {
    const flags = deriveCareJourneyBilling({
      usages: [{ billed: true, invoiceStatus: "FECHADA" }],
    });
    expect(flags.hasOpenInvoice).toBe(true);
    expect(flags.hasPaidInvoice).toBe(false);
    expect(resolveCareJourneyStep({ appointmentStatus: "REALIZADO", ...flags })).toBe("faturado");
  });

  it("usage faturado sem invoiceId ainda avança para faturado", () => {
    const flags = deriveCareJourneyBilling({
      usages: [{ billed: true, invoiceStatus: null }],
    });
    expect(flags.hasOpenInvoice).toBe(true);
    expect(resolveCareJourneyStep({ appointmentStatus: "REALIZADO", ...flags })).toBe("faturado");
  });

  it("usage não faturado permanece em realizado", () => {
    const flags = deriveCareJourneyBilling({
      usages: [{ billed: false }],
    });
    expect(flags.hasUnbilledUsages).toBe(true);
    expect(resolveCareJourneyStep({ appointmentStatus: "REALIZADO", ...flags })).toBe("realizado");
  });
});
