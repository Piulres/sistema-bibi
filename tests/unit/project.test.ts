import { describe, expect, it } from "vitest";
import {
  isProjectStatus,
  projectStatusLabel,
  isBudgetStatus,
  budgetStatusLabel,
  isAttachmentCategory,
} from "@/lib/project/constants";
import { NICHE_MASTER_LABELS } from "@/constants/niches";

describe("project.constants", () => {
  it("valida status de obra", () => {
    expect(isProjectStatus("EM_OBRA")).toBe(true);
    expect(isProjectStatus("INVALID")).toBe(false);
    expect(projectStatusLabel("PROPOSTA")).toBe("Proposta");
  });

  it("valida status de orçamento", () => {
    expect(isBudgetStatus("ENVIADO")).toBe(true);
    expect(budgetStatusLabel("RASCUNHO")).toBe("Rascunho");
  });

  it("valida categorias de anexo", () => {
    expect(isAttachmentCategory("PLANTA")).toBe(true);
    expect(isAttachmentCategory("X")).toBe(false);
  });
});

describe("CONSTRUCTION niche labels", () => {
  it("define glossário completo", () => {
    expect(NICHE_MASTER_LABELS.CONSTRUCTION.patient).toBe("Obra");
    expect(NICHE_MASTER_LABELS.CONSTRUCTION.medicalRecord).toBe("Dossiê técnico");
    expect(NICHE_MASTER_LABELS.CONSTRUCTION.appointment).toBe("Vistoria");
  });
});
