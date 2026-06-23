import { describe, expect, it } from "vitest";
import { getNicheConfig, getDefaultLabels } from "@/lib/niche/defaults";
import { mergeNicheLabels } from "@/lib/niche/labels";
import { getNicheLandingContent } from "@/lib/niche/landing-content";
import { isNicheId, NICHE_IDS } from "@/lib/niche/types";
import { NICHE_DEMOS } from "../../prisma/seed-data/niche-tenants";

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
    const spa = NICHE_DEMOS.find((d) => d.niche === "SPA");

    expect(dental?.procedures.find((p) => p.code === "DEN-CON")?.basePrice).toBe(350);
    expect(legal?.procedures.find((p) => p.code === "LEG-PAR")?.basePrice).toBe(600);
    expect(spa?.procedures.find((p) => p.code === "SPA-YOG")?.basePrice).toBe(120);
  });

  it("cobre os cinco nichos além de MEDICAL", () => {
    expect(NICHE_DEMOS.map((d) => d.niche).sort()).toEqual(
      ["DENTAL", "EDUCATION", "LEGAL", "SPA", "VET"].sort(),
    );
  });
});
