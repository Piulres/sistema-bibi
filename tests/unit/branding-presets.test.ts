import { describe, expect, it } from "vitest";
import { BRANDING_PRESETS, SEGMENT_BRANDING_PRESETS, VARIETY_BRANDING_PRESETS } from "@/lib/theme/presets";
import { NICHE_IDS } from "@/lib/niche/types";

describe("branding presets", () => {
  it("inclui preset para cada segmento", () => {
    expect(SEGMENT_BRANDING_PRESETS).toHaveLength(NICHE_IDS.length);
    for (const niche of NICHE_IDS) {
      expect(SEGMENT_BRANDING_PRESETS.some((p) => p.id === `segment-${niche.toLowerCase()}`)).toBe(
        true,
      );
    }
  });

  it("oferece variedades adicionais além dos segmentos", () => {
    expect(VARIETY_BRANDING_PRESETS.length).toBeGreaterThanOrEqual(4);
  });

  it("cada preset tem cores hex válidas", () => {
    for (const preset of BRANDING_PRESETS) {
      expect(preset.tokens.primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(preset.tokens.accentColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
