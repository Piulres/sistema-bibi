#!/usr/bin/env node
/**
 * Build da Netlify (GitHub + CLI).
 * - Resolve DATABASE_URL absoluto (prisma/dev.db)
 * - Grava .env para workers do Next.js herdarem variáveis no CI
 * - Executa db:push, seed e next build
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dbFile = join(root, "prisma", "dev.db");
const databaseUrl = process.env.DATABASE_URL?.startsWith("file:")
  ? process.env.DATABASE_URL.startsWith("file:./")
    ? `file:${dbFile}`
    : process.env.DATABASE_URL
  : `file:${dbFile}`;

process.env.DATABASE_URL = databaseUrl;
process.env.NETLIFY = process.env.NETLIFY ?? "true";

writeFileSync(
  join(root, ".env"),
  [
    `DATABASE_URL="${databaseUrl}"`,
    `NETLIFY="${process.env.NETLIFY}"`,
    process.env.SESSION_SECRET ? `SESSION_SECRET="${process.env.SESSION_SECRET}"` : "",
  ]
    .filter(Boolean)
    .join("\n") + "\n",
  "utf8",
);

const run = (cmd) => {
  execSync(cmd, { stdio: "inherit", env: process.env, cwd: root });
};

run("npm run db:push");
run("npm run db:seed");
run("npm run build");
