import { describe, expect, it } from "vitest";
import {
  INTERNO_MODULES,
  INTERNO_PROFILES,
  hasInternoPermission,
  isInternoAdmin,
  resolveInternoPermissions,
} from "@/lib/interno-permissions";

describe("interno-permissions (RBAC)", () => {
  it("perfis não-interno não recebem módulos", () => {
    expect(resolveInternoPermissions("PRESTADOR", "ADMIN")).toEqual([]);
  });

  it("interno sem perfil = ADMIN (compat seed)", () => {
    expect(resolveInternoPermissions("INTERNO", null)).toEqual([...INTERNO_MODULES]);
    expect(resolveInternoPermissions("INTERNO", undefined)).toEqual([...INTERNO_MODULES]);
    expect(resolveInternoPermissions("INTERNO", "INVALID")).toEqual([...INTERNO_MODULES]);
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

  it("isInternoAdmin identifica ADMIN e null", () => {
    expect(isInternoAdmin("INTERNO", "ADMIN")).toBe(true);
    expect(isInternoAdmin("INTERNO", null)).toBe(true);
    expect(isInternoAdmin("INTERNO", "FATURAMENTO")).toBe(false);
    expect(isInternoAdmin("PRESTADOR", "ADMIN")).toBe(false);
  });
});
