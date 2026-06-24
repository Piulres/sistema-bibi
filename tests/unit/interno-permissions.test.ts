import { describe, expect, it } from "vitest";
import {
  INTERNO_PROFILES,
  INTERNO_MODULES,
  hasInternoPermission,
  isInternoAdmin,
  resolveInternoPermissions,
} from "@/lib/interno-permissions";

describe("interno-permissions (RBAC)", () => {
  it("perfis não-interno não recebem módulos", () => {
    expect(resolveInternoPermissions("PRESTADOR", "ADMIN")).toEqual([]);
  });

  it("interno sem perfil = READONLY (menor privilégio)", () => {
    expect(resolveInternoPermissions("INTERNO", null)).toEqual(INTERNO_PROFILES.READONLY);
    expect(resolveInternoPermissions("INTERNO", undefined)).toEqual(INTERNO_PROFILES.READONLY);
    expect(resolveInternoPermissions("INTERNO", "INVALID")).toEqual(INTERNO_PROFILES.READONLY);
    expect(hasInternoPermission("INTERNO", null, "billing")).toBe(false);
  });

  it("FATURAMENTO só acessa módulos de receita", () => {
    const allowed = resolveInternoPermissions("INTERNO", "FATURAMENTO");
    expect(allowed).toEqual(INTERNO_PROFILES.FATURAMENTO);
    expect(hasInternoPermission("INTERNO", "FATURAMENTO", "billing")).toBe(true);
    expect(hasInternoPermission("INTERNO", "FATURAMENTO", "cadastros")).toBe(false);
  });

  it("RECEPCAO não acessa faturamento", () => {
    expect(hasInternoPermission("INTERNO", "RECEPCAO", "agenda")).toBe(true);
    expect(hasInternoPermission("INTERNO", "RECEPCAO", "billing")).toBe(false);
  });

  it("READONLY é somente leitura", () => {
    expect(hasInternoPermission("INTERNO", "READONLY", "dashboard")).toBe(true);
    expect(hasInternoPermission("INTERNO", "READONLY", "relatorios")).toBe(true);
    expect(hasInternoPermission("INTERNO", "READONLY", "billing")).toBe(false);
    expect(hasInternoPermission("INTERNO", "READONLY", "integracoes")).toBe(false);
  });

  it("isInternoAdmin exige perfil ADMIN explícito", () => {
    expect(isInternoAdmin("INTERNO", "ADMIN")).toBe(true);
    expect(isInternoAdmin("INTERNO", null)).toBe(false);
    expect(isInternoAdmin("INTERNO", "FATURAMENTO")).toBe(false);
    expect(isInternoAdmin("PRESTADOR", "ADMIN")).toBe(false);
  });

  it("ADMIN acessa todos os módulos", () => {
    expect(resolveInternoPermissions("INTERNO", "ADMIN")).toEqual([...INTERNO_MODULES]);
  });
});
