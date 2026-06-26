import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const OPENAPI_PATH = join(ROOT, "public", "openapi.yaml");
const API_ROOT = join(ROOT, "src", "app", "api");
const SWAGGER_DIR = join(ROOT, "public", "swagger-ui");

function toOpenApiSegment(segment: string) {
  if (segment.startsWith("[") && segment.endsWith("]")) {
    const inner = segment.slice(1, -1);
    if (inner.startsWith("...")) return `{${inner.slice(3)}}`;
    return `{${inner}}`;
  }
  return segment;
}

function routeFileToOpenApiPath(file: string) {
  const rel = relative(API_ROOT, file).replace(/\\/g, "/");
  if (!rel.endsWith("/route.ts")) return null;
  const segments = rel.slice(0, -"/route.ts".length).split("/");
  return `/api/${segments.map(toOpenApiSegment).join("/")}`;
}

function collectRouteHandlers(dir: string, files: string[] = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectRouteHandlers(full, files);
    else if (entry === "route.ts") files.push(full);
  }
  return files;
}

function collectOpenApiPaths(spec: { paths?: Record<string, unknown> }) {
  const paths = spec.paths ?? {};
  const result = new Set<string>();
  for (const [path, methods] of Object.entries(paths)) {
    if (!methods || typeof methods !== "object") continue;
    const httpMethods = Object.keys(methods).filter((m) =>
      ["get", "post", "put", "patch", "delete", "head", "options"].includes(m),
    );
    if (httpMethods.length > 0) result.add(path);
  }
  return result;
}

describe("contrato OpenAPI", () => {
  const spec = parseYaml(readFileSync(OPENAPI_PATH, "utf8")) as {
    openapi: string;
    info: { title: string; version: string };
    paths: Record<string, unknown>;
    servers?: { url: string }[];
    components?: { securitySchemes?: Record<string, unknown> };
  };

  it("é OpenAPI 3.x com metadados do ServiceOS", () => {
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.info.title).toMatch(/ServiceOS/i);
    expect(spec.info.version).toMatch(/^\d+\.\d+/);
  });

  it("documenta autenticação por cookie de sessão", () => {
    expect(spec.components?.securitySchemes?.sessionCookie).toMatchObject({
      type: "apiKey",
      in: "cookie",
      name: "bibi_session",
    });
  });

  it("inclui servidores local e produção", () => {
    const urls = (spec.servers ?? []).map((s) => s.url);
    expect(urls.some((u) => u.includes("localhost"))).toBe(true);
    expect(urls.some((u) => u.includes("sistema-bibi.netlify.app"))).toBe(true);
  });

  it("cobre os endpoints principais documentados", () => {
    const paths = collectOpenApiPaths(spec);
    expect(paths.size).toBeGreaterThanOrEqual(115);
    expect(paths.has("/api/auth/login")).toBe(true);
    expect(paths.has("/api/prestador/agenda")).toBe(true);
    expect(paths.has("/api/interno/billing")).toBe(true);
    expect(paths.has("/api/beneficiario/overview")).toBe(true);
    expect(paths.has("/api/assistant/chat")).toBe(true);
  });

  it("não referencia paths órfãos sem Route Handler", () => {
    const handlerPaths = new Set(
      collectRouteHandlers(API_ROOT)
        .map(routeFileToOpenApiPath)
        .filter((p): p is string => Boolean(p)),
    );
    const openApiPaths = collectOpenApiPaths(spec);
    const orphans = [...openApiPaths].filter(
      (p) => !handlerPaths.has(p) && p !== "/api/docs",
    );
    expect(orphans).toEqual([]);
  });
});

describe("assets Swagger UI self-hosted", () => {
  it("expõe bundle e CSS em public/swagger-ui", () => {
    expect(statSync(join(SWAGGER_DIR, "swagger-ui-bundle.js")).isFile()).toBe(true);
    expect(statSync(join(SWAGGER_DIR, "swagger-ui.css")).isFile()).toBe(true);
  });
});
