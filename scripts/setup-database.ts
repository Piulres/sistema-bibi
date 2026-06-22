#!/usr/bin/env npx tsx
/**
 * Setup de banco no build ou bootstrap local.
 * Dual SQLite (demo + operação):
 *   - demo.db      → massa completa (seed)
 *   - operation.db → schema + bootstrap mínimo (sem massa PJ)
 * Postgres: migrate deploy (modo operação legado).
 */
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  databaseEnvSummary,
  isPostgresDatabaseUrl,
  shouldSeedOnBuild,
} from "../src/lib/database-env";
import { runOperationBootstrap } from "../prisma/seed-data/operation-bootstrap";

const root = process.cwd();
const prismaDir = join(root, "prisma");
const demoDb = join(prismaDir, "demo.db");
const operationDb = join(prismaDir, "operation.db");
const legacyDb = join(prismaDir, "dev.db");

function run(cmd: string, env: Record<string, string | undefined> = {}) {
  execSync(cmd, {
    stdio: "inherit",
    env: { ...process.env, ...env },
    cwd: root,
  });
}

function removeSqliteFiles() {
  for (const file of [demoDb, operationDb, legacyDb]) {
    if (existsSync(file)) unlinkSync(file);
    const journal = `${file}-journal`;
    if (existsSync(journal)) unlinkSync(journal);
  }
}

async function bootstrapOperationDb() {
  const prisma = new PrismaClient({
    datasources: { db: { url: `file:${operationDb}` } },
  });
  try {
    await runOperationBootstrap(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

async function setupSqliteDualStore() {
  console.log("▶ Dual SQLite — demo.db + operation.db");
  removeSqliteFiles();

  console.log("  1/3 demo.db — schema + seed");
  run("npx prisma db push", { DATABASE_URL: `file:${demoDb}` });
  if (shouldSeedOnBuild()) {
    run("npx prisma db seed", { DATABASE_URL: `file:${demoDb}` });
  } else {
    console.log("  ○ Seed demo omitido — RUN_SEED_ON_BUILD=false");
  }

  console.log("  2/3 operation.db — schema");
  run("npx prisma db push", { DATABASE_URL: `file:${operationDb}` });

  console.log("  3/3 operation.db — bootstrap mínimo");
  await bootstrapOperationDb();

  copyFileSync(demoDb, legacyDb);
  console.log("  ✓ dev.db espelha demo.db (compatibilidade local)");
}

function setupPostgres() {
  const migrationsDir = join(root, "prisma", "migrations");
  const hasMigrations =
    existsSync(migrationsDir) && existsSync(join(migrationsDir, "migration_lock.toml"));

  if (hasMigrations) {
    console.log("▶ prisma migrate deploy (Postgres)");
    run("npx prisma migrate deploy");
  } else {
    console.log("▶ prisma db push (Postgres — sem migrations ainda)");
    run("npx prisma db push");
  }

  if (shouldSeedOnBuild()) {
    console.log("▶ prisma db seed (massa demo)");
    run("npx prisma db seed");
  } else {
    console.log("○ Seed omitido — modo operação");
  }
}

async function main() {
  const summary = databaseEnvSummary();
  console.log("\n── Database setup ──");
  console.log(`  APP_MODE:          ${summary.appMode}`);
  console.log(`  Provider:          ${summary.provider}`);
  console.log(`  RUN_SEED_ON_BUILD: ${summary.seedOnBuild}`);
  console.log(`  ALLOW_DEMO_RESET:  ${summary.demoReset}`);
  console.log("");

  if (isPostgresDatabaseUrl()) {
    setupPostgres();
  } else {
    await setupSqliteDualStore();
  }

  console.log("\n✓ Database setup concluído\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
