#!/usr/bin/env node
/**
 * Build da Netlify (GitHub + CLI).
 * - Resolve DATABASE_URL absoluto (prisma/dev.db) em SQLite
 * - Grava .env para workers do Next.js herdarem variáveis no CI
 * - Setup de banco via scripts/setup-database.ts (respeita APP_MODE / RUN_SEED_ON_BUILD)
 * - next build
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const demoDbFile = join(root, "prisma", "demo.db");
const dbFile = demoDbFile;
const databaseUrl = process.env.DATABASE_URL?.startsWith("file:")
  ? process.env.DATABASE_URL.startsWith("file:./")
    ? `file:${dbFile}`
    : process.env.DATABASE_URL
  : process.env.DATABASE_URL ?? `file:${dbFile}`;

process.env.DATABASE_URL = databaseUrl;
process.env.NETLIFY = process.env.NETLIFY ?? "true";

writeFileSync(
  join(root, ".env"),
  [
    `DATABASE_URL="${databaseUrl}"`,
    `NETLIFY="${process.env.NETLIFY}"`,
    process.env.APP_MODE ? `APP_MODE="${process.env.APP_MODE}"` : "",
    process.env.RUN_SEED_ON_BUILD ? `RUN_SEED_ON_BUILD="${process.env.RUN_SEED_ON_BUILD}"` : "",
    process.env.ALLOW_DEMO_RESET ? `ALLOW_DEMO_RESET="${process.env.ALLOW_DEMO_RESET}"` : "",
    `DUAL_DATA_STORE="true"`,
    process.env.SESSION_SECRET ? `SESSION_SECRET="${process.env.SESSION_SECRET}"` : "",
  ]
    .filter(Boolean)
    .join("\n") + "\n",
  "utf8",
);

const run = (cmd) => {
  execSync(cmd, { stdio: "inherit", env: process.env, cwd: root });
};

run("node scripts/copy-swagger-ui.mjs");
run("npx tsx scripts/setup-database.ts");
run("npm run build");
