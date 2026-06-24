import { describe, expect, it } from "vitest";
import { applyNicheBrandingDefaults } from "@/lib/niche/branding";
import { brandingToCssVars } from "@/lib/theme/css-vars";
import { CLINIC_BRANDING_DEFAULTS } from "@/lib/theme/tokens";

describe("niche branding", () => {
  it("preserva whitelabel salvo no banco (fromDatabase)", () => {
    const saved = {
      displayName: "PetCare",
      tagline: null,
      logoUrl: null,
      primaryColor: "#059669",
      accentColor: "#34d399",
      heroFrom: "#047857",
      heroTo: "#34d399",
      platformLabel: "Powered by Sistema Bibi - ServiceOS",
      colorScheme: "light" as const,
      customDomain: null,
      customDomainVerified: false,
    };

    const result = applyNicheBrandingDefaults("VET", saved, { fromDatabase: true });
    expect(result.accentColor).toBe("#34d399");
    expect(result.primaryColor).toBe("#059669");
  });

  it("aplica paleta do segmento quando não há registro no banco", () => {
    const fallback = {
      displayName: "Operação",
      ...CLINIC_BRANDING_DEFAULTS,
    };

    const result = applyNicheBrandingDefaults("VET", fallback);
    expect(result.primaryColor).toBe("#059669");
    expect(result.accentColor).toBe("#34d399");
  });

  it("espelha whitelabel em variáveis de portal", () => {
    const vars = brandingToCssVars({
      displayName: "Test",
      tagline: null,
      logoUrl: null,
      primaryColor: "#059669",
      accentColor: "#34d399",
      heroFrom: "#047857",
      heroTo: "#34d399",
      platformLabel: "Test",
      colorScheme: "light",
      customDomain: null,
      customDomainVerified: false,
    });

    expect(vars["--portal-accent"]).toBe("#34d399");
    expect(vars["--brand-accent"]).toBe("#34d399");
    expect(vars["--portal-accent-from"]).toBe("#047857");
  });
});
