#!/usr/bin/env node
/**
 * Build da Netlify (GitHub + CLI).
 * - Gera .env para workers do Next.js herdarem DATABASE_URL
 * - Executa db:push, seed e next build
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

process.env.DATABASE_URL = databaseUrl;
process.env.NETLIFY = process.env.NETLIFY ?? "true";

writeFileSync(
  join(root, ".env"),
  `DATABASE_URL="${databaseUrl}"\nNETLIFY="${process.env.NETLIFY}"\n`,
  "utf8",
);

const run = (cmd) => {
  execSync(cmd, { stdio: "inherit", env: process.env, cwd: root });
};

run("npm run db:push");
run("npm run db:seed");
run("npm run build");
