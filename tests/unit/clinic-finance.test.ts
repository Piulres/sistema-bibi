import { describe, expect, it } from "vitest";
import {
  CLINIC_EXPENSE_CATEGORIES,
  CLINIC_PAYMENT_METHODS,
  clinicExpenseCategoryLabel,
  clinicPaymentMethodLabel,
} from "@/lib/clinic-finance/constants";
import {
  getCedigExamBasePrice,
  suggestCedigAmount,
} from "@/lib/clinic-finance/cedig-pricing";
import {
  CEDIG_PROCEDURES,
  CEDIG_LABEL_OVERRIDES,
  CEDIG_STAFF,
} from "../../prisma/seed-data/cedig-catalog";

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
  it("tem exames diagnósticos, mucosectomia e teste respiratório", () => {
    const codes = CEDIG_PROCEDURES.map((p) => p.code);
    expect(codes).toContain("CEDIG-ENDO");
    expect(codes).toContain("CEDIG-COLO");
    expect(codes).toContain("CEDIG-ENDO-COLO");
    expect(codes).toContain("CEDIG-MUCO");
    expect(codes).toContain("CEDIG-RESP");
  });

  it("usa preço Particular como basePrice do catálogo", () => {
    const endo = CEDIG_PROCEDURES.find((p) => p.code === "CEDIG-ENDO");
    const colo = CEDIG_PROCEDURES.find((p) => p.code === "CEDIG-COLO");
    expect(endo?.basePrice).toBe(750);
    expect(colo?.basePrice).toBe(1450);
  });

  it("sobrescreve labels para Exame", () => {
    expect(CEDIG_LABEL_OVERRIDES.appointment).toBe("Exame");
    expect(CEDIG_LABEL_OVERRIDES.procedures).toBe("Exames");
  });

  it("equipe CEDIG usa nomes realistas e não reintroduz aliases legados bruno@/luiza@", () => {
    const names = CEDIG_STAFF.map((u) => u.name);
    const emails = CEDIG_STAFF.map((u) => u.email);
    expect(names.some((n) => n.includes("Alexandre Marçal"))).toBe(true);
    expect(names.some((n) => n.includes("Bruno Dias"))).toBe(true);
    expect(names.some((n) => n.includes("Luiza Lage"))).toBe(true);
    expect(names.some((n) => n.includes("Luiza Zeraik"))).toBe(true);
    expect(names.some((n) => n.includes("Fernanda Autran"))).toBe(true);
    expect(names).toContain("Alana Ferreira");
    expect(names).toContain("Renata Oliveira");
    expect(names).toContain("João Marcos");
    expect(names).toContain("Márcia Souza");
    expect(emails).not.toContain("bruno@cedig.demo");
    expect(emails).not.toContain("luiza@cedig.demo");
    expect(new Set(names.filter((n) => n.startsWith("Dr"))).size).toBe(
      names.filter((n) => n.startsWith("Dr")).length,
    );
  });
});

describe("cedig pricing tables", () => {
  it("diferencia Particular e CentralMed nos exames", () => {
    expect(getCedigExamBasePrice("CEDIG-ENDO", "PARTICULAR")).toBe(750);
    expect(getCedigExamBasePrice("CEDIG-ENDO", "CENTRALMED")).toBe(650);
    expect(getCedigExamBasePrice("CEDIG-COLO", "PARTICULAR")).toBe(1450);
    expect(getCedigExamBasePrice("CEDIG-COLO", "CENTRALMED")).toBe(1250);
    expect(getCedigExamBasePrice("CEDIG-ENDO-COLO", "PARTICULAR")).toBe(2000);
    expect(getCedigExamBasePrice("CEDIG-ENDO-COLO", "CENTRALMED")).toBe(1900);
  });

  it("preço do teste respiratório por tabela", () => {
    expect(getCedigExamBasePrice("CEDIG-RESP", "PARTICULAR")).toBe(500);
    expect(getCedigExamBasePrice("CEDIG-RESP", "BEM_SAUDE")).toBe(450);
    expect(getCedigExamBasePrice("CEDIG-RESP", "DR_SAUDE")).toBe(450);
    expect(getCedigExamBasePrice("CEDIG-RESP", "CENTRALMED")).toBe(400);
  });

  it("sugere valor com biópsia, polipectomia e clip", () => {
    const sug = suggestCedigAmount({
      procedureCode: "CEDIG-COLO",
      priceTable: "CENTRALMED",
      biopsies: 2,
      polypectomies: 1,
      polypectomyTier: "INTERMEDIARIA",
      clips: 1,
    });
    expect(sug).not.toBeNull();
    // 1250 + 2*150 + 800 + 800 = 3150
    expect(sug!.total).toBe(3150);
  });

  it("mucosectomia terapêutica não duplica o valor base", () => {
    const sug = suggestCedigAmount({
      procedureCode: "CEDIG-MUCO",
      priceTable: "PARTICULAR",
      mucosectomies: 1,
    });
    expect(sug!.total).toBe(3200);
  });
});
