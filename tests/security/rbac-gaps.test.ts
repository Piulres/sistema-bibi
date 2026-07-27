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

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const ADMIN_ONLY_ROUTES = new Set([
  "/interno/users",
  "/interno/users/[id]",
]);

/** Extrai handlers exportados no route.ts (nível top). */
function extractHandlerBlocks(source: string): { method: string; body: string }[] {
  const blocks: { method: string; body: string }[] = [];
  const re = /export async function (GET|POST|PUT|PATCH|DELETE)\s*\([^)]*\)\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const method = m[1];
    let depth = 0;
    let i = m.index + m[0].length - 1;
    for (; i < source.length; i++) {
      const ch = source[i];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          blocks.push({ method, body: source.slice(m.index, i + 1) });
          break;
        }
      }
    }
  }
  return blocks;
}

function mutatingHandlersWithoutWriteGuard(file: string): string[] {
  const apiPath = relativeApiPath(file);
  if (ADMIN_ONLY_ROUTES.has(apiPath)) return [];

  const src = readFileSync(file, "utf8");
  const gaps: string[] = [];
  for (const { method, body } of extractHandlerBlocks(src)) {
    if (!MUTATING_METHODS.has(method)) continue;
    const hasWrite =
      body.includes("requireInternoModuleWrite(") ||
      body.includes("requireInternoAdmin(");
    const usesReadOnly = body.includes("requireInternoModule(");
    if (!hasWrite && usesReadOnly) {
      gaps.push(`${apiPath} ${method}`);
    }
  }
  return gaps;
}

/** Inventário RBAC — rotas internas devem usar requireInternoModule. */
describe("RBAC — APIs internas com requireInternoModule", () => {
  const routes = listRouteFiles(API_ROOT);

  const withoutModuleGuard = routes.filter((file) => {
    const src = readFileSync(file, "utf8");
    return (
      !src.includes("requireInternoModule") &&
      !src.includes("requireInternoAdmin") &&
      !src.includes("requireInternoModuleWrite")
    );
  });

  it("todas as rotas internas usam guard de módulo", () => {
    expect(withoutModuleGuard).toEqual([]);
  });

  it("rotas sensíveis não ficam expostas sem guard", () => {
    const exposed = withoutModuleGuard.map(relativeApiPath).sort();
    expect(exposed).not.toContain("/interno/billing");
    expect(exposed).not.toContain("/interno/invoices/[id]/pix");
    expect(exposed).not.toContain("/interno/data-store");
    expect(exposed).not.toContain("/interno/users");
  });

  it("READONLY não deveria acessar billing na matriz de permissões", () => {
    expect(hasInternoPermission("INTERNO", "READONLY", "billing")).toBe(false);
    expect(hasInternoPermission("INTERNO", "READONLY", "cadastros")).toBe(false);
    expect(hasInternoPermission("INTERNO", null, "billing")).toBe(false);
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
    expect(INTERNO_MODULES.length).toBe(16);
    expect(guardedCount).toBe(routes.length);
  });
});

/** Mutations devem bloquear perfil READONLY via requireInternoModuleWrite. */
describe("RBAC — guards de escrita em handlers mutáveis", () => {
  const routes = listRouteFiles(API_ROOT);

  const writeGuardGaps = routes.flatMap((file) => mutatingHandlersWithoutWriteGuard(file));

  it("POST/PATCH/PUT/DELETE usam requireInternoModuleWrite (ou Admin)", () => {
    expect(writeGuardGaps).toEqual([]);
  });

  it("rotas destrutivas com write guard (referência)", () => {
    const guarded = routes
      .filter((f) => readFileSync(f, "utf8").includes("requireInternoModuleWrite"))
      .map(relativeApiPath)
      .sort();

    expect(guarded).toContain("/interno/invoices/[id]/void");
    expect(guarded).toContain("/interno/stock/movements/[id]/reverse");
    expect(guarded).toContain("/interno/patients");
    expect(guarded).toContain("/interno/assistant/settings");
  });
});
