import { describe, expect, it } from "vitest";
import {
  CLINIC_EXPENSE_CATEGORIES,
  CLINIC_PAYMENT_METHODS,
  clinicExpenseCategoryLabel,
  clinicPaymentMethodLabel,
} from "@/lib/clinic-finance/constants";
import { CEDIG_PROCEDURES, CEDIG_LABEL_OVERRIDES } from "../../prisma/seed-data/cedig-catalog";

describe("clinic-finance constants", () => {
  it("expõe categorias pedidas pelo CEDIG", () => {
    const ids = CLINIC_EXPENSE_CATEGORIES.map((c) => c.id);
    expect(ids).toContain("LABORATORIO");
    expect(ids).toContain("ANESTESISTA");
    expect(ids).toContain("PESSOAL");
    expect(ids).toContain("TAXA_CARTAO");
    expect(clinicExpenseCategoryLabel("LABORATORIO")).toMatch(/biópsias/i);
  });

  it("expõe formas de pagamento com menus prontos", () => {
    expect(CLINIC_PAYMENT_METHODS.length).toBeGreaterThanOrEqual(4);
    expect(clinicPaymentMethodLabel("PIX")).toBe("PIX");
  });
});

describe("cedig catalog", () => {
  it("tem endoscopia e colonoscopia", () => {
    const codes = CEDIG_PROCEDURES.map((p) => p.code);
    expect(codes).toContain("CEDIG-ENDO");
    expect(codes).toContain("CEDIG-COLO");
  });

  it("sobrescreve labels para Exame", () => {
    expect(CEDIG_LABEL_OVERRIDES.appointment).toBe("Exame");
    expect(CEDIG_LABEL_OVERRIDES.procedures).toBe("Exames");
  });
});
