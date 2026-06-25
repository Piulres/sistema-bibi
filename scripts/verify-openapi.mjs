#!/usr/bin/env node
/**
 * Valida public/openapi.yaml: estrutura, paths e cobertura vs Route Handlers.
 * Uso: npm run openapi:verify
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";

const ROOT = process.cwd();
const OPENAPI_PATH = join(ROOT, "public", "openapi.yaml");
const API_ROOT = join(ROOT, "src", "app", "api");

/** Converte segmento de rota Next para template OpenAPI. */
function toOpenApiSegment(segment) {
  if (segment.startsWith("[") && segment.endsWith("]")) {
    const inner = segment.slice(1, -1);
    if (inner.startsWith("...")) return `{${inner.slice(3)}}`;
    return `{${inner}}`;
  }
  return segment;
}

/** src/app/api/foo/[id]/route.ts → /api/foo/{id} */
function routeFileToOpenApiPath(file) {
  const rel = relative(API_ROOT, file).replace(/\\/g, "/");
  if (!rel.endsWith("/route.ts")) return null;
  const segments = rel.slice(0, -"/route.ts".length).split("/");
  return `/api/${segments.map(toOpenApiSegment).join("/")}`;
}

function collectRouteHandlers(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectRouteHandlers(full, files);
    else if (entry === "route.ts") files.push(full);
  }
  return files;
}

function collectOpenApiPaths(spec) {
  const paths = spec.paths ?? {};
  const result = new Set();
  for (const [path, methods] of Object.entries(paths)) {
    if (!methods || typeof methods !== "object") continue;
    const httpMethods = Object.keys(methods).filter((m) =>
      ["get", "post", "put", "patch", "delete", "head", "options"].includes(m),
    );
    if (httpMethods.length > 0) result.add(path);
  }
  return result;
}

const errors = [];
const warnings = [];

let spec;
try {
  spec = parseYaml(readFileSync(OPENAPI_PATH, "utf8"));
} catch (err) {
  console.error(`openapi:verify — falha ao ler ${OPENAPI_PATH}:`, err);
  process.exit(1);
}

if (!spec?.openapi?.startsWith("3.")) {
  errors.push("Campo openapi deve ser 3.x");
}
if (!spec?.info?.title) errors.push("Campo info.title ausente");
if (!spec?.paths || Object.keys(spec.paths).length === 0) {
  errors.push("Nenhum path documentado em paths");
}

const openApiPaths = collectOpenApiPaths(spec);
const handlerFiles = collectRouteHandlers(API_ROOT);
const handlerPaths = new Set(
  handlerFiles.map(routeFileToOpenApiPath).filter(Boolean),
);

// Páginas sob /api que não são Route Handlers
const NON_HANDLER_API_PATHS = new Set(["/api/docs"]);

const undocumentedHandlers = [...handlerPaths]
  .filter((p) => !openApiPaths.has(p))
  .sort();

const orphanOpenApiPaths = [...openApiPaths]
  .filter((p) => !handlerPaths.has(p) && !NON_HANDLER_API_PATHS.has(p))
  .sort();

if (undocumentedHandlers.length > 0) {
  warnings.push(
    `${undocumentedHandlers.length} Route Handler(s) sem path no OpenAPI (primeiros 10):`,
  );
  for (const p of undocumentedHandlers.slice(0, 10)) warnings.push(`  - ${p}`);
  if (undocumentedHandlers.length > 10) {
    warnings.push(`  … e mais ${undocumentedHandlers.length - 10}`);
  }
}

if (orphanOpenApiPaths.length > 0) {
  errors.push(
    `${orphanOpenApiPaths.length} path(s) no OpenAPI sem Route Handler correspondente:`,
  );
  for (const p of orphanOpenApiPaths.slice(0, 15)) errors.push(`  - ${p}`);
  if (orphanOpenApiPaths.length > 15) {
    errors.push(`  … e mais ${orphanOpenApiPaths.length - 15}`);
  }
}

const MIN_DOCUMENTED_PATHS = 70;
if (openApiPaths.size < MIN_DOCUMENTED_PATHS) {
  errors.push(
    `Esperado ≥ ${MIN_DOCUMENTED_PATHS} paths documentados; encontrado ${openApiPaths.size}`,
  );
}

if (!spec.servers?.some((s) => String(s.url).includes("localhost"))) {
  warnings.push("Servidor localhost ausente em servers");
}

if (errors.length > 0) {
  console.error("openapi:verify FALHOU:\n");
  for (const e of errors) console.error(`  ✗ ${e}`);
  if (warnings.length > 0) {
    console.error("\nAvisos:\n");
    for (const w of warnings) console.error(`  ⚠ ${w}`);
  }
  process.exit(1);
}

console.log("openapi:verify OK");
console.log(`  Spec: ${OPENAPI_PATH}`);
console.log(`  Versão: ${spec.info?.version ?? "?"}`);
console.log(`  Paths documentados: ${openApiPaths.size}`);
console.log(`  Route Handlers: ${handlerPaths.size}`);
if (undocumentedHandlers.length > 0) {
  console.log(`  Handlers sem OpenAPI: ${undocumentedHandlers.length} (aviso)`);
}
if (warnings.length > 0) {
  console.log("\nAvisos:");
  for (const w of warnings) console.warn(`  ⚠ ${w}`);
}
