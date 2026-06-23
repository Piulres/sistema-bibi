#!/usr/bin/env node
/**
 * Valida um pacote fechado ANTES de publicar na Netlify.
 * Não faz deploy — só lint + build Netlify (mesmo pipeline do CI).
 *
 * Uso: npm run pre-release
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const run = (cmd) => {
  console.log(`\n▶ ${cmd}\n`);
  execSync(cmd, { stdio: "inherit", cwd: root });
};

const gitHead = () => {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
};

console.log("╔══════════════════════════════════════════╗");
console.log("║  ServiceOS Bibi — Pre-release (sem deploy) ║");
console.log("╚══════════════════════════════════════════╝");
console.log(`Commit: ${gitHead()}`);
console.log("Este script NÃO publica na Netlify.\n");

const steps = [
  { name: "lint", cmd: "npm run lint" },
  { name: "docs-verify", cmd: "npm run docs:verify" },
  { name: "db-verify", cmd: "npm run db:verify" },
  { name: "test", cmd: "npm test" },
  { name: "netlify-build", cmd: "npm run netlify:build" },
];

for (const step of steps) {
  try {
    run(step.cmd);
  } catch {
    console.error(`\n✗ Falhou em: ${step.name}`);
    console.error("Corrija antes de fechar o pacote. Ver docs/versoes/RELEASES.md\n");
    process.exit(1);
  }
}

// Lembrete do pacote pendente
const releasesPath = join(root, "docs", "versoes", "RELEASES.md");
try {
  const releases = readFileSync(releasesPath, "utf8");
  const match = releases.match(/### `(bibi-poc-[^`]+)` \*\(rascunho/);
  if (match) {
    console.log(`\n📦 Próximo pacote rascunho: ${match[1]}`);
  }
} catch {
  // ok
}

console.log("\n✓ Pre-release OK — pacote validado localmente.");
console.log("  Publicar só quando quiser: npx netlify deploy --prod");
console.log("  Registrar em: docs/versoes/RELEASES.md\n");
