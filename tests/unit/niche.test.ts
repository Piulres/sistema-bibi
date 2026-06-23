import { describe, expect, it } from "vitest";
import {
  NICHE_GLOSSARY_SUMMARY,
  NICHE_LABEL_KEYS,
  NICHE_MASTER_LABELS,
  resolveNicheLabels,
} from "@/constants/niches";
import { getNicheConfig, getDefaultLabels } from "@/lib/niche/defaults";
import { mergeNicheLabels } from "@/lib/niche/labels";
import { getNicheLandingContent } from "@/lib/niche/landing-content";
import { isNicheId, NICHE_IDS } from "@/lib/niche/types";
import { NICHE_DEMOS } from "../../prisma/seed-data/niche-tenants";

describe("constants.niches.NICHE_MASTER_LABELS", () => {
  it("define todas as chaves obrigatórias para cada nicho", () => {
    for (const niche of NICHE_IDS) {
      for (const key of NICHE_LABEL_KEYS) {
        expect(NICHE_MASTER_LABELS[niche][key], `${niche}.${key}`).toBeTruthy();
      }
    }
  });

  it("expõe glossário resumido para documentação", () => {
    expect(NICHE_GLOSSARY_SUMMARY.VET.patient).toBe("Pet");
    expect(NICHE_GLOSSARY_SUMMARY.LEGAL.patient).toBe("Cliente");
  });
});

describe("constants.niches.resolveNicheLabels", () => {
  it("aplica overrides parciais sobre o mestre", () => {
    const labels = resolveNicheLabels("VET", { appointment: "Banho/Tosa" });
    expect(labels.appointment).toBe("Banho/Tosa");
    expect(labels.provider).toBe("Veterinário");
  });
});

describe("niche.isNicheId", () => {
  it("aceita todos os nichos canônicos", () => {
    for (const id of NICHE_IDS) {
      expect(isNicheId(id)).toBe(true);
    }
  });

  it("rejeita valores inválidos", () => {
    expect(isNicheId("HOSPITAL")).toBe(false);
    expect(isNicheId("")).toBe(false);
  });
});

describe("niche.getNicheConfig", () => {
  it("retorna config do nicho solicitado", () => {
    const vet = getNicheConfig("VET");
    expect(vet.id).toBe("VET");
    expect(vet.labels.patient).toBe("Pet");
  });

  it("cai em MEDICAL para nicho desconhecido", () => {
    expect(getNicheConfig("INVALID").id).toBe("MEDICAL");
  });
});

describe("niche.mergeNicheLabels", () => {
  it("usa defaults quando labels é null", () => {
    const labels = mergeNicheLabels("LEGAL", null);
    expect(labels.patient).toBe("Cliente");
    expect(labels.provider).toBe("Advogado");
  });

  it("sobrescreve chaves do JSON do tenant", () => {
    const labels = mergeNicheLabels(
      "VET",
      JSON.stringify({ patient: "Animal de estimação" }),
    );
    expect(labels.patient).toBe("Animal de estimação");
    expect(labels.provider).toBe("Veterinário");
  });

  it("ignora JSON inválido e mantém defaults", () => {
    const labels = mergeNicheLabels("SPA", "{invalid");
    expect(labels.patient).toBe(getDefaultLabels("SPA").patient);
  });
});

describe("niche.getNicheLandingContent", () => {
  it("adapta features para veterinária", () => {
    const content = getNicheLandingContent("VET");
    expect(content.featuresSection.title).toMatch(/veterinária/i);
    expect(content.features[0]?.description).toMatch(/tutor/i);
    expect(content.faq.some((f) => f.question.includes("ServiceOS"))).toBe(true);
  });

  it("adapta portais para jurídico", () => {
    const content = getNicheLandingContent("LEGAL");
    const prestador = content.portals.find((p) => p.key === "prestador");
    expect(prestador?.audience).toBe("Advogados");
  });
});

describe("niche seed demos", () => {
  it("define procedimentos com preços esperados", () => {
    const dental = NICHE_DEMOS.find((d) => d.niche === "DENTAL");
    const legal = NICHE_DEMOS.find((d) => d.niche === "LEGAL");
    const vet = NICHE_DEMOS.find((d) => d.niche === "VET");

    expect(dental?.procedures.find((p) => p.code === "DEN-CON")?.basePrice).toBe(350);
    expect(legal?.procedures.find((p) => p.code === "LEG-HT")?.basePrice).toBe(500);
    expect(vet?.procedures.find((p) => p.code === "VET-BAN")?.basePrice).toBe(150);
  });

  it("cobre os cinco nichos além de MEDICAL", () => {
    expect(NICHE_DEMOS.map((d) => d.niche).sort()).toEqual(
      ["DENTAL", "EDUCATION", "LEGAL", "SPA", "VET"].sort(),
    );
  });
});
