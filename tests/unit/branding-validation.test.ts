import { describe, expect, it } from "vitest";
import {
  validateBrandingInput,
  validateCustomDomain,
  validateLogoUrl,
} from "@/lib/theme/branding-validation";

const validInput = {
  displayName: "Clínica Demo",
  primaryColor: "#1e293b",
  accentColor: "#f97316",
  heroFrom: "#1e293b",
  heroTo: "#f59e0b",
  platformLabel: "Powered by Sistema Bibi - ServiceOS",
};

describe("branding-validation", () => {
  it("aceita branding válido", () => {
    expect(validateBrandingInput(validInput)).toBeNull();
  });

  it("rejeita hex inválido", () => {
    expect(
      validateBrandingInput({ ...validInput, primaryColor: "red" }),
    ).toMatch(/hex/i);
  });

  it("rejeita domínio inválido", () => {
    expect(validateCustomDomain("not a domain")).toMatch(/inválido/i);
    expect(validateCustomDomain("saude.cliente.com.br")).toBeNull();
  });

  it("aceita logo interno da API", () => {
    expect(validateLogoUrl("/api/branding/logo/tenant-1")).toBeNull();
  });

  it("rejeita data URL gigante (>300KB)", () => {
    const huge = `data:image/png;base64,${"A".repeat(310_000)}`;
    expect(validateLogoUrl(huge)).toMatch(/limite/i);
  });
});
