import { describe, expect, it } from "vitest";
import { HOME_NAV_ANCHORS, landingNavItems } from "@/lib/landing/navigation";
import { PLATFORM } from "@/lib/platform";
import { PLATFORM_BRANDING } from "@/lib/theme/tokens";

describe("landing navigation (home)", () => {
  it("mantém menu enxuto sem ROI/Comparativo/Para quem", () => {
    const labels = HOME_NAV_ANCHORS.map((item) => item.label);
    expect(labels).toEqual([
      "Solução",
      "Como funciona",
      "Segmentos",
      "Demo",
      "Portais",
      "Contato",
      "FAQ",
    ]);
    expect(labels).not.toContain("ROI");
    expect(labels).not.toContain("Comparativo");
    expect(labels).not.toContain("Para quem");
  });

  it("landingNavItems(home) usa as âncoras da home", () => {
    expect(landingNavItems("home")).toBe(HOME_NAV_ANCHORS);
  });
});

describe("landing header brand", () => {
  it("exibe apenas Sistema Bibi no header (sem sufixo ServiceOS)", () => {
    expect(PLATFORM.brandName).toBe("Sistema Bibi");
    expect(PLATFORM.brandMark).toBe("Bibi");
    expect(PLATFORM_BRANDING.displayName).toBe("Sistema Bibi");
    expect(PLATFORM.name).toBe("Sistema Bibi - ServiceOS");
  });
});
