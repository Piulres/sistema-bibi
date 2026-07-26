#!/usr/bin/env node
/**
 * Setup idempotente para VM/dev nova (agentes e humanos).
 * Uso: npm run setup
 *
 * Faz, sem comandos destrutivos:
 *  1. cria .env a partir de .env.example (se ausente);
 *  2. `prisma db push` (cria/atualiza o schema no dev.db);
 *  3. `prisma db seed` (popula a massa demo) apenas se o banco estiver vazio;
 *  4. remove resíduo do dual-store (prisma/.data-store-mode + operation.db vazio)
 *     que pode sobrar após `npm run test` e apontar o dev para um banco vazio.
 *
 * NÃO instala dependências (rode `npm install` antes) nem baixa browsers do
 * Playwright — para e2e rode `npx playwright install chromium` uma vez.
 */
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ENV = join(ROOT, ".env");
const ENV_EXAMPLE = join(ROOT, ".env.example");
const DEV_DB = join(ROOT, "prisma", "dev.db");
const MODE_FILE = join(ROOT, "prisma", ".data-store-mode");
const OPERATION_DB = join(ROOT, "prisma", "operation.db");

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}

function step(label) {
  console.log(`\n\u2192 ${label}`);
}

// 1. .env
if (!existsSync(ENV)) {
  if (!existsSync(ENV_EXAMPLE)) {
    console.error("\u2717 .env.example não encontrado — não é possível criar .env.");
    process.exit(1);
  }
  step("Criando .env a partir de .env.example");
  copyFileSync(ENV_EXAMPLE, ENV);
} else {
  step(".env já existe — mantido");
}

// 4 (antes do push): limpa resíduo do dual-store que aponta o dev para banco vazio.
if (existsSync(MODE_FILE)) {
  step("Removendo resíduo prisma/.data-store-mode (evita dev apontar para operation.db vazio)");
  rmSync(MODE_FILE, { force: true });
}
if (existsSync(OPERATION_DB) && statSync(OPERATION_DB).size === 0) {
  rmSync(OPERATION_DB, { force: true });
}

// 2. schema
step("Sincronizando schema (prisma db push)");
run("npx prisma db push");

// 3. seed condicional
const needsSeed = !existsSync(DEV_DB) || statSync(DEV_DB).size < 50_000;
if (needsSeed) {
  step("Populando massa demo (prisma db seed)");
  run("npx prisma db seed");
} else {
  step("dev.db já populado — seed pulado (use `npm run db:seed` para refazer)");
}

console.log(
  "\n\u2713 Setup concluído. Credenciais demo: senha `bibi123`.\n" +
    "  Dev:  npm run dev\n" +
    "  E2E:  npx playwright install chromium  (uma vez) e pare o dev server antes de `npm run test:e2e`.\n",
);
