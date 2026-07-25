import { describe, expect, it } from "vitest";
import {
  CEDIG_PRICE_TABLE_COMPANY_NAME,
  generateProvisionalCpf,
  mapClinicPaymentToInvoiceMethod,
} from "@/lib/clinic-finance/bridge-helpers";
import { isValidCpf } from "@/lib/validation/br-documents";
import { canInternoWrite } from "@/lib/interno-permissions";

describe("clinic-finance bridge helpers", () => {
  it("gera CPF provisório válido e estável", () => {
    const a = generateProvisionalCpf("cedig:Maria Silva:0");
    const b = generateProvisionalCpf("cedig:Maria Silva:0");
    expect(a).toBe(b);
    expect(isValidCpf(a)).toBe(true);
  });

  it("mapeia pagamento clínica → método de fatura", () => {
    expect(mapClinicPaymentToInvoiceMethod("PIX")).toBe("PIX");
    expect(mapClinicPaymentToInvoiceMethod("CONVENIO")).toBe("CONVENIO");
    expect(mapClinicPaymentToInvoiceMethod("OUTRO")).toBe("MANUAL");
  });

  it("mapeia tabela CEDIG → empresa", () => {
    expect(CEDIG_PRICE_TABLE_COMPANY_NAME.CENTRALMED).toBe("CentralMed");
    expect(CEDIG_PRICE_TABLE_COMPANY_NAME.PARTICULAR).toBeNull();
    expect(CEDIG_PRICE_TABLE_COMPANY_NAME.BEM_SAUDE).toBe("Bem Saúde");
  });

  it("READONLY não pode escrever no portal interno", () => {
    expect(canInternoWrite("INTERNO", "READONLY")).toBe(false);
    expect(canInternoWrite("INTERNO", null)).toBe(false);
    expect(canInternoWrite("INTERNO", "RECEPCAO")).toBe(true);
    expect(canInternoWrite("INTERNO", "ADMIN")).toBe(true);
  });
});
