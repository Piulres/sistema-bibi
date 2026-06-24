import { describe, expect, it } from "vitest";
import {
  hasInternoPermission,
  isInternoAdmin,
  resolveInternoPermissions,
} from "@/lib/interno-permissions";

describe("interno-permissions — menor privilégio", () => {
  it("perfil null/inválido recebe READONLY, não ADMIN", () => {
    expect(resolveInternoPermissions("INTERNO", null)).toEqual(
      resolveInternoPermissions("INTERNO", "READONLY"),
    );
    expect(hasInternoPermission("INTERNO", null, "billing")).toBe(false);
    expect(hasInternoPermission("INTERNO", null, "cadastros")).toBe(false);
    expect(hasInternoPermission("INTERNO", null, "auditoria")).toBe(true);
  });

  it("isInternoAdmin exige perfil ADMIN explícito", () => {
    expect(isInternoAdmin("INTERNO", "ADMIN")).toBe(true);
    expect(isInternoAdmin("INTERNO", null)).toBe(false);
    expect(isInternoAdmin("INTERNO", "RECEPCAO")).toBe(false);
  });
});
