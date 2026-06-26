#!/usr/bin/env node
/**
 * Sincroniza public/openapi.yaml com Route Handlers ausentes.
 * - Paths novos: bloco inserido antes de /api/cron/reminders
 * - Métodos extras em paths existentes: inseridos no bloco do path
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

const ROOT = process.cwd();
const OPENAPI_PATH = join(ROOT, "public", "openapi.yaml");
const API_ROOT = join(ROOT, "src", "app", "api");
const INSERT_BEFORE = "  /api/cron/reminders:";

const METHOD_MAP = {
  GET: "get",
  POST: "post",
  PUT: "put",
  PATCH: "patch",
  DELETE: "delete",
};

const TAG_RULES = [
  { match: /^\/api\/prestador\/appointments\/\{id\}\/voa/, tags: ["Voa", "Prestador"] },
  { match: /^\/api\/prestador\/pets/, tags: ["Pets", "Prestador"] },
  { match: /^\/api\/prestador\//, tags: ["Prestador"] },
  { match: /^\/api\/interno\/stock\//, tags: ["Estoque", "Interno"] },
  { match: /^\/api\/interno\/import\//, tags: ["Importação", "Interno"] },
  { match: /^\/api\/interno\/(audit|change|revisions)/, tags: ["Change Management", "Interno"] },
  { match: /^\/api\/interno\//, tags: ["Interno"] },
  { match: /^\/api\/beneficiario\/pets/, tags: ["Pets", "Beneficiário"] },
  { match: /^\/api\/beneficiario\//, tags: ["Beneficiário"] },
  { match: /^\/api\/segment\//, tags: ["Segmento"], public: true },
];

const SUMMARY = {
  "/api/prestador/appointments/{id}/voa|get": "Configuração de sessão Voa Health (plugin mount)",
  "/api/prestador/appointments/{id}/voa/import|post": "Importa documento Voa para o PEP",
  "/api/interno/appointments/walk-in|post": "Walk-in atômico — cria paciente e agenda",
  "/api/interno/data-store|get": "Status dual-store demo/operação",
  "/api/interno/data-store|post": "Alterna modo demo ↔ operação (ADMIN)",
  "/api/interno/demo/reset|get": "Status do reset demo",
  "/api/interno/demo/reset|post": "Restaura seed demo (ADMIN)",
  "/api/segment/persist|post": "Persiste cookie bibi_segment",
  "/api/interno/import/{entity}|get": "Export template ou dados da entidade (JSON/CSV)",
};

function toOpenApiSegment(segment) {
  if (segment.startsWith("[") && segment.endsWith("]")) {
    const inner = segment.slice(1, -1);
    return inner.startsWith("...") ? `{${inner.slice(3)}}` : `{${inner}}`;
  }
  return segment;
}

function routeFileToOpenApiPath(file) {
  const rel = relative(API_ROOT, file).replace(/\\/g, "/");
  if (!rel.endsWith("/route.ts")) return null;
  const segments = rel.slice(0, -9).split("/");
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

function extractMethods(filePath) {
  const src = readFileSync(filePath, "utf8");
  return Object.entries(METHOD_MAP)
    .filter(([name]) => new RegExp(`export\\s+(?:async\\s+)?function\\s+${name}\\b`).test(src))
    .map(([, m]) => m);
}

function pathParams(openApiPath) {
  return openApiPath
    .split("/")
    .filter((p) => p.startsWith("{") && p.endsWith("}"))
    .map((p) => ({
      name: p.slice(1, -1),
      in: "path",
      required: true,
      schema: { type: "string" },
    }));
}

function resolveTags(openApiPath) {
  for (const rule of TAG_RULES) {
    if (rule.match.test(openApiPath)) return { tags: rule.tags, public: rule.public ?? false };
  }
  return { tags: ["Interno"], public: false };
}

function roleFromTags(tags) {
  if (tags.includes("Prestador")) return "PRESTADOR";
  if (tags.includes("Interno") || tags.includes("Estoque")) return "INTERNO";
  if (tags.includes("Beneficiário")) return "BENEFICIARIO";
  return null;
}

function buildOperation(path, method, tags, isPublic) {
  const key = `${path}|${method}`;
  const summary =
    SUMMARY[key] ??
    `${method.toUpperCase()} ${path.split("/").slice(-2).join(" ").replace(/\{|\}/g, "")}`;

  const op = {
    tags,
    summary,
    responses: {
      "200": { description: "OK" },
      "401": { description: "Não autenticado" },
    },
  };

  if (isPublic) op.security = [];
  else {
    const role = roleFromTags(tags);
    if (role) op.responses["403"] = { description: `Acesso negado (role != ${role})` };
  }

  if (["post", "put", "patch"].includes(method)) {
    op.requestBody = {
      content: { "application/json": { schema: { type: "object" } } },
    };
  }

  if (path.includes("/export") && method === "get") {
    op.parameters = [
      {
        name: "format",
        in: "query",
        schema: { type: "string", enum: ["pdf", "xlsx", "csv", "json"] },
      },
    ];
    op.responses["200"] = { description: "Arquivo exportado" };
  }

  if (path === "/api/prestador/appointments/{id}/voa/import" && method === "post") {
    op.responses["503"] = { description: "VOA_ENABLED=false" };
    op.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["patientId", "document"],
            properties: {
              patientId: { type: "string" },
              document: { type: "string" },
              templateName: { type: "string", nullable: true },
              templateSlug: { type: "string", nullable: true },
              structuredOutput: { type: "object", nullable: true },
            },
          },
        },
      },
    };
  }

  if (path === "/api/prestador/appointments/{id}/voa" && method === "get") {
    op.responses["200"] = {
      description: "Config Voa (enabled, token, mount)",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              enabled: { type: "boolean" },
              configured: { type: "boolean" },
              pluginScriptUrl: { type: "string" },
              token: { type: "string", nullable: true },
              mount: { type: "object" },
            },
          },
        },
      },
    };
  }

  return op;
}

function indentBlock(yaml, spaces = 2) {
  const pad = " ".repeat(spaces);
  return yaml
    .split("\n")
    .map((line) => (line ? `${pad}${line}` : line))
    .join("\n");
}

function pathHasMethodInFile(content, openApiPath, method) {
  const pathLine = `  ${openApiPath}:`;
  const startIdx = content.indexOf(pathLine);
  if (startIdx === -1) return false;
  const tail = content.slice(startIdx + pathLine.length);
  const nextPath = tail.search(/\n  \/api\//);
  const block = nextPath === -1 ? tail : tail.slice(0, nextPath);
  return new RegExp(`\n    ${method}:`).test(block);
}

function formatMethodBlock(method, op) {
  const opYaml = stringifyYaml(op, { lineWidth: 0 }).trim();
  const opIndented = opYaml
    .split("\n")
    .map((line) => (line ? `      ${line}` : line))
    .join("\n");
  return `    ${method}:\n${opIndented}`;
}

function findPathBlockEnd(lines, startIdx) {
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^  \/api\//.test(lines[i])) return i;
  }
  return lines.length;
}

const spec = parseYaml(readFileSync(OPENAPI_PATH, "utf8"));
spec.paths ??= {};

const newPaths = {};
const methodPatches = [];
let addedOps = 0;

for (const file of collectRouteHandlers(API_ROOT)) {
  const openApiPath = routeFileToOpenApiPath(file);
  if (!openApiPath || openApiPath === "/api/docs") continue;

  const methods = extractMethods(file);
  const { tags, public: isPublic } = resolveTags(openApiPath);
  const params = pathParams(openApiPath);

  for (const method of methods) {
    if (spec.paths[openApiPath]?.[method]) continue;
    if (pathHasMethodInFile(readFileSync(OPENAPI_PATH, "utf8"), openApiPath, method)) continue;

    const op = buildOperation(openApiPath, method, tags, isPublic);
    addedOps++;

    if (spec.paths[openApiPath]) {
      methodPatches.push({ path: openApiPath, method, op });
    } else {
      if (!newPaths[openApiPath]) {
        newPaths[openApiPath] = params.length ? { parameters: params } : {};
      }
      newPaths[openApiPath][method] = op;
    }
  }
}

if (addedOps === 0) {
  console.log("sync-openapi-paths: nada a adicionar");
  process.exit(0);
}

let content = readFileSync(OPENAPI_PATH, "utf8");

// Insere métodos em paths existentes (do fim para o início para não invalidar índices)
const lines = content.split("\n");
for (const patch of [...methodPatches].reverse()) {
  if (pathHasMethodInFile(content, patch.path, patch.method)) continue;
  const pathLine = `  ${patch.path}:`;
  const startIdx = lines.findIndex((l) => l === pathLine);
  if (startIdx === -1) continue;
  const endIdx = findPathBlockEnd(lines, startIdx);
  const methodYaml = formatMethodBlock(patch.method, patch.op);
  lines.splice(endIdx, 0, methodYaml);
}
content = lines.join("\n");

// Insere paths novos
if (Object.keys(newPaths).length > 0) {
  const blockYaml = stringifyYaml(newPaths, { lineWidth: 0 }).trim();
  const block = `\n  # --- paths sincronizados (scripts/sync-openapi-paths.mjs) ---\n${indentBlock(blockYaml, 2)}\n\n`;
  if (!content.includes(INSERT_BEFORE)) {
    console.error("Marcador de inserção não encontrado");
    process.exit(1);
  }
  content = content.replace(INSERT_BEFORE, `${block}${INSERT_BEFORE}`);
}

// Tags extras
for (const tag of [
  "  - name: Voa\n    description: Integração Voa Health — IA clínica no atendimento",
  "  - name: Estoque\n    description: Gestão de estoque médico (produtos, lotes, movimentações)",
  "  - name: Segmento\n    description: Persistência de segmento/tenant na landing",
]) {
  const name = tag.match(/name: (\w+)/)?.[1];
  if (name && !content.includes(`- name: ${name}`)) {
    content = content.replace(
      "  - name: Change Management",
      `${tag}\n  - name: Change Management`,
    );
  }
}

writeFileSync(OPENAPI_PATH, content, "utf8");
console.log(
  `sync-openapi-paths: +${addedOps} ops (${Object.keys(newPaths).length} paths novos, ${methodPatches.length} métodos em paths existentes)`,
);
