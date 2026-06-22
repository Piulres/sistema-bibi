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

/** Inventário RBAC — rotas internas devem usar requireInternoModule. */
describe("RBAC — APIs internas com requireInternoModule", () => {
  const routes = listRouteFiles(API_ROOT);

  const withoutModuleGuard = routes.filter((file) => {
    const src = readFileSync(file, "utf8");
    return !src.includes("requireInternoModule");
  });

  it("todas as rotas internas usam guard de módulo", () => {
    expect(withoutModuleGuard).toEqual([]);
  });

  it("rotas sensíveis não ficam expostas sem guard", () => {
    const exposed = withoutModuleGuard.map(relativeApiPath).sort();
    expect(exposed).not.toContain("/interno/billing");
    expect(exposed).not.toContain("/interno/invoices/[id]/pix");
    expect(exposed).not.toContain("/interno/data-store");
  });

  it("READONLY não deveria acessar billing na matriz de permissões", () => {
    expect(hasInternoPermission("INTERNO", "READONLY", "billing")).toBe(false);
    expect(hasInternoPermission("INTERNO", "READONLY", "cadastros")).toBe(false);
    expect(hasInternoPermission("INTERNO", "READONLY", "auditoria")).toBe(true);
    expect(hasInternoPermission("INTERNO", "FATURAMENTO", "auditoria")).toBe(true);
  });

  it("módulos com guard (referência)", () => {
    const guarded = routes
      .filter((f) => readFileSync(f, "utf8").includes("requireInternoModule"))
      .map(relativeApiPath)
      .sort();

    expect(guarded).toContain("/interno/invoices");
    expect(guarded).toContain("/interno/billing");
    expect(guarded).toContain("/interno/dashboard");
    expect(guarded).toContain("/interno/webhooks");
  });

  it("cobertura: todas as rotas com guard", () => {
    const guardedCount = routes.length - withoutModuleGuard.length;
    expect(INTERNO_MODULES.length).toBe(12);
    expect(guardedCount).toBe(routes.length);
  });
});
