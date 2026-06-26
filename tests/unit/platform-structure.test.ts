import { describe, expect, it } from "vitest";
import {
  isSegmentLandingSlug,
  nicheFromSegmentSlug,
  PLATFORM_STRUCTURE,
  SALES_SITE_SECTIONS,
  SEGMENT_LANDING_PAGES,
  segmentLandingHref,
  segmentSlugFromNiche,
} from "@/lib/platform/structure";

describe("platform structure", () => {
  it("define 7 landing pages por segmento", () => {
    expect(SEGMENT_LANDING_PAGES).toHaveLength(7);
    expect(SEGMENT_LANDING_PAGES.map((p) => p.href)).toEqual([
      "/segmentos/saude",
      "/segmentos/veterinaria",
      "/segmentos/odontologia",
      "/segmentos/juridico",
      "/segmentos/bem-estar",
      "/segmentos/educacao",
      "/segmentos/engenharia",
    ]);
  });

  it("resolve slug de segmento para nicho", () => {
    expect(nicheFromSegmentSlug("veterinaria")).toBe("VET");
    expect(isSegmentLandingSlug("saude")).toBe(true);
    expect(isSegmentLandingSlug("invalido")).toBe(false);
  });

  it("gera href canônico por nicho", () => {
    expect(segmentLandingHref("VET")).toBe("/segmentos/veterinaria");
    expect(segmentSlugFromNiche("LEGAL")).toBe("juridico");
  });

  it("estrutura raiz contém landing e quatro portais", () => {
    const children = PLATFORM_STRUCTURE.children?.map((c) => c.id) ?? [];
    expect(children).toEqual(["landing", "interno", "prestador", "pj", "beneficiario"]);
  });

  it("site de venda tem quatro seções", () => {
    expect(SALES_SITE_SECTIONS.map((s) => s.id)).toEqual([
      "propositos",
      "para-quem",
      "missao",
      "valor",
    ]);
  });
});
