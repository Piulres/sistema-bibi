import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { INTERNO_MODULES, hasInternoPermission } from "@/lib/interno-permissions";

const API_ROOT = join(process.cwd(), "src/app/api/interno");

function listRouteFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...listRouteFiles(full));
    } else if (entry === "route.ts") {
      files.push(full);
    }
  }
  return files;
}

function relativeApiPath(file: string): string {
  return file
    .replace(join(process.cwd(), "src/app/api"), "")
    .replace("/route.ts", "");
}

/**
 * Documenta lacuna de segurança: UI filtra nav por RBAC, mas a maioria das APIs
 * internas só exige role INTERNO — perfil READONLY pode chamar billing, cadastros etc.
 */
describe("RBAC gaps — APIs internas sem requireInternoModule", () => {
  const routes = listRouteFiles(API_ROOT);

  const withoutModuleGuard = routes.filter((file) => {
    const src = readFileSync(file, "utf8");
    return !src.includes("requireInternoModule");
  });

  it("maioria das rotas internas não usa guard de módulo", () => {
    expect(withoutModuleGuard.length).toBeGreaterThan(10);
    expect(withoutModuleGuard.length).toBeLessThan(routes.length);
  });

  it("lista rotas expostas a qualquer perfil INTERNO (incl. READONLY)", () => {
    const exposed = withoutModuleGuard.map(relativeApiPath).sort();
    expect(exposed).toContain("/interno/billing");
    expect(exposed).toContain("/interno/procedures");
    expect(exposed).toContain("/interno/invoices/[id]/pix");
  });

  it("READONLY não deveria acessar billing na matriz de permissões", () => {
    expect(hasInternoPermission("INTERNO", "READONLY", "billing")).toBe(false);
    expect(hasInternoPermission("INTERNO", "READONLY", "cadastros")).toBe(false);
  });

  it("módulos com guard correto (referência para correção)", () => {
    const guarded = routes
      .filter((f) => readFileSync(f, "utf8").includes("requireInternoModule"))
      .map(relativeApiPath)
      .sort();

    expect(guarded).toContain("/interno/invoices");
    expect(guarded).toContain("/interno/users");
    expect(guarded).toContain("/interno/branding");
    expect(guarded).toContain("/interno/webhooks");
  });

  it("cobertura esperada: 11 módulos × rotas sensíveis", () => {
    const guardedCount = routes.length - withoutModuleGuard.length;
    expect(INTERNO_MODULES.length).toBe(11);
    expect(guardedCount).toBeLessThan(routes.length / 2);
  });
});
