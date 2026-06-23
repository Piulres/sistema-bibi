#!/usr/bin/env node
/**
 * Verifica caminhos de documentação obsoletos e menções desatualizadas à marca.
 * Uso: npm run docs:verify
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

const OBSOLETE_DOC_PATHS = [
  "docs/OPERACOES.md",
  "docs/RELEASES.md",
  "docs/V2_0.md",
  "docs/FLUXOS.md",
  "docs/ARQUITETURA.md",
  "docs/pesquisa/nichos/10-nicho-vet.md",
];

const STALE_PATTERNS = [
  { pattern: /Sistema Bibi — Gestão Inteligente em Saúde/g, hint: "metadata layout — use ServiceOS" },
  { pattern: /applicationCategory:\s*"HealthApplication"/g, hint: "LandingJsonLd — use BusinessApplication" },
  { pattern: /Entre com as credenciais da sua clínica/g, hint: "login pages — copy genérica multi-segmento" },
];

const ALLOWLIST = [
  "scripts/verify-docs.mjs",
  "docs/versoes/",
  "docs/pesquisa/",
  "docs/plataforma/HISTORICO",
  "CHANGELOG",
];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".git" || entry === ".next") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (/\.(md|mdc|tsx?|json)$/.test(entry)) files.push(full);
  }
  return files;
}

const errors = [];

for (const path of OBSOLETE_DOC_PATHS) {
  try {
    statSync(join(ROOT, path));
    errors.push(`Arquivo obsoleto ainda existe na raiz antiga: ${path}`);
  } catch {
    // ok — moved
  }
}

for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  if (ALLOWLIST.some((a) => rel.includes(a))) continue;
  const content = readFileSync(file, "utf8");
  for (const { pattern, hint } of STALE_PATTERNS) {
    if (pattern.test(content)) {
      errors.push(`${rel}: ${hint}`);
      pattern.lastIndex = 0;
    }
  }
}

if (errors.length > 0) {
  console.error("docs:verify falhou:\n");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log("docs:verify OK — estrutura por segmentos e menções críticas consistentes.");
