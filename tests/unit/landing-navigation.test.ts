import { describe, expect, it } from "vitest";
import { HOME_NAV_ANCHORS, landingNavItems } from "@/lib/landing/navigation";

describe("landing navigation (home)", () => {
  it("mantém menu enxuto sem ROI/Comparativo/Para quem", () => {
    const labels = HOME_NAV_ANCHORS.map((item) => item.label);
    expect(labels).toEqual([
      "Solução",
      "Demo",
      "Segmentos",
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
