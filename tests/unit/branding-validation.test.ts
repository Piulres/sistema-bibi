import { describe, expect, it } from "vitest";
import {
  validateBrandingInput,
  validateCustomDomain,
  validateLogoUrl,
} from "@/lib/theme/branding-validation";

const validInput = {
  displayName: "Clínica Demo",
  primaryColor: "#0d9488",
  accentColor: "#14b8a6",
  heroFrom: "#0f172a",
  heroTo: "#134e4a",
  platformLabel: "Powered by ServiceOS Bibi",
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
