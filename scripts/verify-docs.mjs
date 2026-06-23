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
  "docs/pesquisa/08-prompt-healthos-expansao.md",
];

const STALE_PATTERNS = [
  { pattern: /Sistema Bibi — Gestão Inteligente em Saúde/g, hint: "metadata layout — use ServiceOS" },
  { pattern: /applicationCategory:\s*"HealthApplication"/g, hint: "LandingJsonLd — use BusinessApplication" },
  { pattern: /Entre com as credenciais da sua clínica/g, hint: "login pages — copy genérica multi-segmento" },
  { pattern: /Powered by Sistema Bibi/g, hint: "platformLabel — use ServiceOS Bibi" },
  { pattern: /issuer = "Sistema Bibi"/g, hint: "MFA issuer — use ServiceOS Bibi" },
];

/** HealthOS só em histórico v1.x ou notas explícitas de migração */
const HEALTHOS_ALLOWLIST = [
  "docs/versoes/",
  "docs/pesquisa/",
  "docs/segmentos/medical/pesquisa-expansao-2026.md",
  "docs/prompts/",
  "docs/README.md",
  "AGENTS.md",
  ".cursor/rules/serviceos-dev.mdc",
  "scripts/verify-docs.mjs",
];

/** Sistema Bibi como marca de produto — legado v1.x */
const SISTEMA_BIBI_ALLOWLIST = [
  "docs/versoes/",
  "docs/plataforma/HISTORICO",
  "docs/plataforma/DESIGN_SYSTEM.md",
  "docs/prompts/",
  "docs/README.md",
  ".cursor/rules/serviceos-dev.mdc",
  "scripts/verify-docs.mjs",
  "sistema-bibi.netlify.app",
];

const SCAN_DIRS = ["docs", ".cursor/rules", "src"];
const SCAN_FILES = ["AGENTS.md", "README.md", "CLAUDE.md"];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".git" || entry === ".next") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (/\.(md|mdc|tsx?)$/.test(entry)) files.push(full);
  }
  return files;
}

function isAllowed(rel, allowlist) {
  return allowlist.some((a) => rel.includes(a) || rel === a);
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

const filesToScan = new Set();
for (const dir of SCAN_DIRS) {
  try {
    for (const f of walk(join(ROOT, dir))) filesToScan.add(f);
  } catch {
    // dir may not exist
  }
}
for (const f of SCAN_FILES) {
  try {
    statSync(join(ROOT, f));
    filesToScan.add(join(ROOT, f));
  } catch {
    // optional
  }
}

for (const file of filesToScan) {
  const rel = relative(ROOT, file);
  const content = readFileSync(file, "utf8");

  for (const { pattern, hint } of STALE_PATTERNS) {
    if (isAllowed(rel, [...HEALTHOS_ALLOWLIST, "docs/versoes/"])) continue;
    if (pattern.test(content)) {
      errors.push(`${rel}: ${hint}`);
      pattern.lastIndex = 0;
    }
  }

  if (/\bHealthOS\b/.test(content) && !isAllowed(rel, HEALTHOS_ALLOWLIST)) {
    errors.push(`${rel}: menção a HealthOS — use ServiceOS (v2.0)`);
  }

  if (/Sistema Bibi/.test(content) && !isAllowed(rel, SISTEMA_BIBI_ALLOWLIST)) {
    errors.push(`${rel}: marca legada "Sistema Bibi" — use ServiceOS Bibi`);
  }
}

if (errors.length > 0) {
  console.error("docs:verify falhou:\n");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log("docs:verify OK — estrutura por segmentos e menções ServiceOS v2.0 consistentes.");
