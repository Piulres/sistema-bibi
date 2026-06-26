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
import { NICHE_INTERNO_DEMOS } from "@/lib/niche/demo-accounts";
import { buildInternoNavTabs, buildCadastrosTabs } from "@/lib/navigation/niche-nav";
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

describe("niche.buildInternoNavTabs", () => {
  it("usa vocabulário do nicho nas abas internas", () => {
    const vet = buildInternoNavTabs(getDefaultLabels("VET"), "VET");
    expect(vet.find((t) => t.key === "cadastros")?.label).toContain("Tutores");
    expect(vet.find((t) => t.key === "agenda")?.label).toBe("Atendimentos");
    expect(vet.find((t) => t.key === "estoque")?.label).toBe("Estoque pet");
  });

  it("inclui aba Pets nos cadastros VET", () => {
    const tabs = buildCadastrosTabs(getDefaultLabels("VET"), "VET");
    expect(tabs.find((t) => t.key === "pets")?.label).toBe("Pets");
    expect(tabs.find((t) => t.key === "patients")?.label).toBe("Tutores");
  });
});

describe("niche.NICHE_INTERNO_DEMOS", () => {
  it("lista contas internas para cada nicho demo", () => {
    expect(NICHE_INTERNO_DEMOS.length).toBe(NICHE_IDS.length);
    expect(NICHE_INTERNO_DEMOS.find((d) => d.niche === "VET")?.internoEmail).toBe(
      "operacao@petcare.demo",
    );
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
    expect(vet?.procedures.find((p) => p.code === "VET-CIR-CAS")?.basePrice).toBe(450);
  });

  it("cobre catálogos expandidos em todos os nichos demo", () => {
    for (const demo of NICHE_DEMOS) {
      expect(demo.procedures.length).toBeGreaterThanOrEqual(12);
      expect(demo.providers.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("cobre os seis nichos além de MEDICAL", () => {
    expect(NICHE_DEMOS.map((d) => d.niche).sort()).toEqual(
      ["CONSTRUCTION", "DENTAL", "EDUCATION", "LEGAL", "SPA", "VET"].sort(),
    );
  });

  it("PetCare não usa override Banho/Tosa na agenda", () => {
    const vet = NICHE_DEMOS.find((d) => d.niche === "VET");
    expect(vet?.slug).toBe("petcare");
    expect(vet?.procedures.some((p) => p.code === "VET-CON")).toBe(true);
    expect(vet?.procedures.some((p) => p.code === "VET-EMER")).toBe(true);
  });
});
