import { describe, expect, it } from "vitest";
import {
  hasInternoPermission,
  resolveInternoPermissions,
} from "@/lib/interno-permissions";

describe("Cenários RBAC — matriz perfil × módulo", () => {
  it("ADMIN acessa todos os 14 módulos", () => {
    const perms = resolveInternoPermissions("INTERNO", "ADMIN");
    expect(perms).toHaveLength(14);
    expect(hasInternoPermission("INTERNO", "ADMIN", "billing")).toBe(true);
    expect(hasInternoPermission("INTERNO", "ADMIN", "projetos")).toBe(true);
    expect(hasInternoPermission("INTERNO", "ADMIN", "auditoria")).toBe(true);
  });

  it("FATURAMENTO: billing sim, cadastros não", () => {
    expect(hasInternoPermission("INTERNO", "FATURAMENTO", "billing")).toBe(true);
    expect(hasInternoPermission("INTERNO", "FATURAMENTO", "subscriptions")).toBe(true);
    expect(hasInternoPermission("INTERNO", "FATURAMENTO", "cadastros")).toBe(false);
    expect(hasInternoPermission("INTERNO", "FATURAMENTO", "seguranca")).toBe(false);
  });

  it("RECEPCAO: agenda e comunicação sim, billing não", () => {
    expect(hasInternoPermission("INTERNO", "RECEPCAO", "agenda")).toBe(true);
    expect(hasInternoPermission("INTERNO", "RECEPCAO", "comunicacao")).toBe(true);
    expect(hasInternoPermission("INTERNO", "RECEPCAO", "cadastros")).toBe(true);
    expect(hasInternoPermission("INTERNO", "RECEPCAO", "estoque")).toBe(true);
    expect(hasInternoPermission("INTERNO", "RECEPCAO", "billing")).toBe(false);
  });

  it("READONLY: dashboard, relatórios e auditoria", () => {
    expect(hasInternoPermission("INTERNO", "READONLY", "dashboard")).toBe(true);
    expect(hasInternoPermission("INTERNO", "READONLY", "relatorios")).toBe(true);
    expect(hasInternoPermission("INTERNO", "READONLY", "auditoria")).toBe(true);
    expect(hasInternoPermission("INTERNO", "READONLY", "billing")).toBe(false);
    expect(hasInternoPermission("INTERNO", "READONLY", "agenda")).toBe(false);
  });

  it("perfil null em INTERNO recebe READONLY (menor privilégio)", () => {
    const perms = resolveInternoPermissions("INTERNO", null);
    expect(perms).toHaveLength(3);
    expect(hasInternoPermission("INTERNO", null, "billing")).toBe(false);
  });

  it("roles não-interno não recebem módulos", () => {
    expect(resolveInternoPermissions("PRESTADOR", "ADMIN")).toEqual([]);
    expect(resolveInternoPermissionSafe("PJ")).toEqual([]);
  });
});

function resolveInternoPermissionSafe(role: string) {
  return resolveInternoPermissions(role, "ADMIN");
}
