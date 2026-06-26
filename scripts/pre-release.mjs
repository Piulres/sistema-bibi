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
const run = (cmd, extraEnv = {}) => {
  console.log(`\n▶ ${cmd}\n`);
  execSync(cmd, {
    stdio: "inherit",
    cwd: root,
    env: { ...process.env, ...extraEnv },
  });
};

const gitHead = () => {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
};

console.log("╔══════════════════════════════════════════╗");
console.log("║  Sistema Bibi - ServiceOS — Pre-release (sem deploy) ║");
console.log("╚══════════════════════════════════════════╝");
console.log(`Commit: ${gitHead()}`);
console.log("Este script NÃO publica na Netlify.\n");

const steps = [
  { name: "lint", cmd: "npm run lint" },
  { name: "docs-verify", cmd: "npm run docs:verify" },
  { name: "openapi-verify", cmd: "npm run openapi:verify" },
  {
    name: "db-bootstrap",
    cmd: "npm run db:bootstrap:demo",
    env: { SEED_SCALE: process.env.SEED_SCALE ?? "small" },
  },
  { name: "db-verify", cmd: "npm run db:verify" },
  { name: "test", cmd: "npm test" },
  { name: "netlify-build", cmd: "npm run netlify:build" },
];

for (const step of steps) {
  try {
    run(step.cmd, step.env ?? {});
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
console.log("  Publicar: npx netlify deploy --prod  (NÃO usar --no-build com Next.js)");
console.log("  Smoke test: /_next/static/chunks/*.css deve retornar 200 após deploy");
console.log("  Registrar em: docs/versoes/RELEASES.md\n");
