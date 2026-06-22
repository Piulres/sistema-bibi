#!/usr/bin/env npx tsx
/**
 * Setup de banco no build ou bootstrap local.
 * - demo + SQLite: db push + seed (massa)
 * - operação + Postgres: migrate deploy (sem seed)
 * - operação + SQLite local: db push apenas (dev/piloto)
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  databaseEnvSummary,
  getAppMode,
  isPostgresDatabaseUrl,
  shouldSeedOnBuild,
} from "../src/lib/database-env";

const root = process.cwd();

function run(cmd: string) {
  execSync(cmd, { stdio: "inherit", env: process.env, cwd: root });
}

function main() {
  const summary = databaseEnvSummary();
  console.log("\n── Database setup ──");
  console.log(`  APP_MODE:        ${summary.appMode}`);
  console.log(`  Provider:        ${summary.provider}`);
  console.log(`  RUN_SEED_ON_BUILD: ${summary.seedOnBuild}`);
  console.log(`  ALLOW_DEMO_RESET:  ${summary.demoReset}`);
  console.log("");

  if (isPostgresDatabaseUrl()) {
    const migrationsDir = join(root, "prisma", "migrations");
    const hasMigrations =
      existsSync(migrationsDir) &&
      existsSync(join(migrationsDir, "migration_lock.toml"));

    if (hasMigrations) {
      console.log("▶ prisma migrate deploy (Postgres)");
      run("npx prisma migrate deploy");
    } else {
      console.log("▶ prisma db push (Postgres — sem migrations ainda)");
      console.warn(
        "  Aviso: crie migrations com `npx prisma migrate dev` antes de produção madura.",
      );
      run("npx prisma db push");
    }
  } else {
    console.log("▶ prisma db push (SQLite)");
    run("npx prisma db push");
  }

  if (shouldSeedOnBuild()) {
    console.log("▶ prisma db seed (massa demo)");
    run("npx prisma db seed");
  } else if (getAppMode() === "operation") {
    console.log("○ Seed omitido — modo operação (dados reais via uso do sistema)");
  } else {
    console.log("○ Seed omitido — RUN_SEED_ON_BUILD=false");
  }

  console.log("\n✓ Database setup concluído\n");
}

main();
