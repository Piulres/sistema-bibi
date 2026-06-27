import { describe, expect, it } from "vitest";
import {
  demoEmailForPortal,
  PORTAL_LOGIN_PATHS,
  resolveSegmentTenantRef,
} from "@/lib/segment/login-demo";
import {
  isDemoSegmentTenantSlug,
  OPERATION_DEFAULT_TENANT_SLUG,
} from "@/lib/data-store/ensure-data-store-for-segment";

describe("login-demo", () => {
  it("resolve tenant ref pelo slug canônico", () => {
    const ref = resolveSegmentTenantRef("lex", "MEDICAL");
    expect(ref.slug).toBe("lex");
    expect(ref.tenant).toBe("Lex & Partners");
    expect(ref.internoEmail).toBe("operacao@lex.demo");
  });

  it("retorna e-mail correto por portal", () => {
    const lex = resolveSegmentTenantRef("lex", "LEGAL");
    expect(demoEmailForPortal(lex, "interno")).toBe("operacao@lex.demo");
    expect(demoEmailForPortal(lex, "prestador")).toBe("dr.andre@lex.demo");
    expect(demoEmailForPortal(lex, "pj")).toBe("rh@assjur.demo");
    expect(demoEmailForPortal(lex, "beneficiario")).toBe("cliente@lex.demo");
  });

  it("mapeia caminhos de login por portal", () => {
    expect(PORTAL_LOGIN_PATHS.interno).toBe("/interno/login");
    expect(PORTAL_LOGIN_PATHS.prestador).toBe("/login");
  });
});

describe("ensure-data-store-for-segment", () => {
  it("identifica tenants demo vs operação", () => {
    expect(isDemoSegmentTenantSlug("lex")).toBe(true);
    expect(isDemoSegmentTenantSlug("horizonte")).toBe(true);
    expect(isDemoSegmentTenantSlug(OPERATION_DEFAULT_TENANT_SLUG)).toBe(false);
    expect(isDemoSegmentTenantSlug("inexistente")).toBe(false);
  });
});
