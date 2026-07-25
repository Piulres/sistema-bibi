import { describe, expect, it } from "vitest";
import {
  buildLoginAccessHref,
  LOGIN_PORTAL_OPTIONS,
  normalizeTenantSlug,
} from "@/lib/auth/login-access";

describe("normalizeTenantSlug", () => {
  it("normaliza maiúsculas, espaços e caracteres inválidos", () => {
    expect(normalizeTenantSlug("  CEDIG Cruzeiro ")).toBe("cedig-cruzeiro");
    expect(normalizeTenantSlug("PetCare")).toBe("petcare");
    expect(normalizeTenantSlug("bibi_saude")).toBe("bibi-saude");
  });

  it("retorna vazio para entrada vazia", () => {
    expect(normalizeTenantSlug("")).toBe("");
    expect(normalizeTenantSlug(null)).toBe("");
  });
});

describe("buildLoginAccessHref", () => {
  it("monta path do portal com ?tenant=", () => {
    expect(buildLoginAccessHref("interno", "cedig")).toBe("/interno/login?tenant=cedig");
    expect(buildLoginAccessHref("prestador", "horizonte")).toBe("/login?tenant=horizonte");
    expect(buildLoginAccessHref("pj", "")).toBe("/pj/login");
  });

  it("expõe os 4 portais", () => {
    expect(LOGIN_PORTAL_OPTIONS.map((o) => o.key)).toEqual([
      "interno",
      "prestador",
      "pj",
      "beneficiario",
    ]);
  });
});
