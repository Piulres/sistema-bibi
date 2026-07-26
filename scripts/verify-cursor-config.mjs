#!/usr/bin/env node
/**
 * Verifica consistência da configuração Cursor (.cursor/rules, skills, AGENTS.md).
 * Uso: npm run cursor:verify
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const errors = [];

function read(rel) {
  const path = join(ROOT, rel);
  if (!existsSync(path)) {
    errors.push(`Arquivo ausente: ${rel}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

// 1. Router único always-on
const rulesDir = join(ROOT, ".cursor/rules");
const ruleFiles = readdirSync(rulesDir).filter((f) => f.endsWith(".mdc"));

const alwaysOn = [];
for (const file of ruleFiles) {
  const content = read(join(".cursor/rules", file));
  if (/alwaysApply:\s*true/.test(content)) {
    alwaysOn.push(file);
  }
}

if (!alwaysOn.includes("router.mdc")) {
  errors.push("Falta router.mdc com alwaysApply: true");
}
if (alwaysOn.length !== 1) {
  errors.push(
    `Esperado 1 rule always-on (router.mdc); encontrado: ${alwaysOn.join(", ") || "(nenhum)"}`,
  );
}

// 2. serviceos-agent-skill.mdc removido
if (existsSync(join(rulesDir, "serviceos-agent-skill.mdc"))) {
  errors.push("serviceos-agent-skill.mdc deve ter sido fundido em router.mdc");
}

// 3. Rules referenciadas em OPERACOES.md existem
const operacoes = read("docs/plataforma/OPERACOES.md");
const expectedRules = [
  "router.mdc",
  "operacoes-bibi.mdc",
  "netlify-release.mdc",
  "stack-nextjs.mdc",
  "serviceos-dev.mdc",
  "tests.mdc",
  "docs-release.mdc",
  "interno-portal.mdc",
];
for (const rule of expectedRules) {
  if (!existsSync(join(rulesDir, rule))) {
    errors.push(`Rule esperada ausente: .cursor/rules/${rule}`);
  }
  if (!operacoes.includes(rule)) {
    errors.push(`OPERACOES.md não referencia .cursor/rules/${rule}`);
  }
}

// 4. Skill references existem
const skillRefs = [
  "crud-entity.md",
  "cedig-clinic.md",
  "billing-pix.md",
  "auth-tenant.md",
  "release-package.md",
  "CHECKLIST.md",
];
for (const ref of skillRefs) {
  const path = `.cursor/skills/serviceos-dev-quality/references/${ref}`;
  if (!existsSync(join(ROOT, path))) {
    errors.push(`Skill reference ausente: ${path}`);
  }
}

// 5. Sem sufixo de branch obsoleto -5f67
const cursorFiles = [
  "AGENTS.md",
  ".cursor/skills/serviceos-dev-quality/SKILL.md",
  ".cursor/skills/serviceos-dev-quality/references/CHECKLIST.md",
  ...ruleFiles.map((f) => `.cursor/rules/${f}`),
];
for (const rel of cursorFiles) {
  const content = read(rel);
  if (content.includes("-5f67")) {
    errors.push(`Sufixo de branch obsoleto -5f67 em ${rel}`);
  }
}

// 6. AGENTS.md enxuto (índice, não manual completo)
const agents = read("AGENTS.md");
const agentsLines = agents.split("\n").length;
if (agentsLines > 120) {
  errors.push(`AGENTS.md com ${agentsLines} linhas — manter como índice (< 120)`);
}

// 7. Versão v2.6 obsoleta em serviceos-dev.mdc
const serviceosDev = read(".cursor/rules/serviceos-dev.mdc");
if (/ServiceOS v2\.6|v2\.6/.test(serviceosDev)) {
  errors.push("serviceos-dev.mdc ainda menciona v2.6 — usar v3");
}

if (errors.length > 0) {
  console.error("cursor:verify — falhou:\n");
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

console.log("cursor:verify — OK");
console.log(`  rules: ${ruleFiles.length} arquivos, 1 always-on (router.mdc)`);
console.log(`  skill references: ${skillRefs.length}`);
console.log(`  AGENTS.md: ${agentsLines} linhas`);
