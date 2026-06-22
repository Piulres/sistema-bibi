#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";

const files = [
  "tests/lib/scheduling-cancel.test.ts",
  "src/lib/scheduling-service.ts",
  "src/lib/patient-service.ts",
  "src/lib/theme/branding.ts",
  "src/lib/pj-portal-service.ts",
  "src/app/api/interno/demo/reset/route.ts",
  "src/lib/company-service.ts",
  "src/lib/company-pipeline.ts",
  "src/lib/beneficiary-overview.ts",
  "src/lib/appointment-service.ts",
  "src/app/api/procedures/route.ts",
  "src/app/api/prestador/records/route.ts",
  "src/app/api/prestador/appointments/[id]/route.ts",
  "src/lib/webhook-service.ts",
  "src/lib/user-service.ts",
  "src/lib/tiss-service.ts",
  "src/lib/timeline.ts",
  "src/lib/tenant-resolver.ts",
  "src/lib/subscription-service.ts",
  "src/lib/session.ts",
  "src/lib/reports/billing-report.ts",
  "src/lib/reminder-service.ts",
  "src/lib/procedure-service.ts",
  "src/lib/pricing.ts",
  "src/app/api/cron/reminders/route.ts",
  "src/app/api/prestador/appointments/[id]/procedures/route.ts",
  "src/app/api/prestador/agenda/route.ts",
  "src/app/api/interno/invoices/route.ts",
  "src/app/api/interno/branding/route.ts",
  "src/app/api/interno/billing/route.ts",
  "src/app/api/interno/branding/logo/route.ts",
  "src/app/api/interno/companies/[id]/status/route.ts",
  "src/app/api/interno/messages/template/route.ts",
  "src/lib/executive-dashboard.ts",
  "src/lib/patient-overview.ts",
  "src/lib/patient-export.ts",
  "src/lib/message-service.ts",
  "src/lib/invoice-service.ts",
  "src/app/api/beneficiario/invoices/[id]/pay/route.ts",
  "src/app/api/auth/mfa/verify/route.ts",
  "src/app/api/auth/mfa/setup/route.ts",
  "src/app/api/auth/login/route.ts",
];

function refactorFile(path) {
  let source = readFileSync(path, "utf8");
  if (!source.includes('from "@/lib/db"') && !source.includes("from '@/lib/db'")) {
    return false;
  }
  if (!source.includes("prisma")) {
    return false;
  }

  source = source.replace(
    /import\s*\{\s*prisma\s*\}\s*from\s*["']@\/lib\/db["'];?/g,
    'import { getPrisma } from "@/lib/db";',
  );

  if (!source.includes("getPrisma")) {
    return false;
  }

  // Já refatorado se todas as funções async que usam prisma têm const prisma = await getPrisma()
  if (source.includes("await getPrisma()") && !source.match(/\bprisma\./)) {
    return false;
  }

  const fnRegex = /(export\s+)?(async\s+)?function\s+(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/g;
  let match;
  const inserts = [];

  while ((match = fnRegex.exec(source)) !== null) {
    const isAsync = Boolean(match[2]);
    const start = match.index + match[0].length;
    const body = extractBlock(source, start - 1);
    if (!body.includes("prisma.")) continue;
    if (body.includes("await getPrisma()")) continue;
    if (!isAsync) {
      console.warn(`  ⚠ ${path}: função sync ${match[3]} usa prisma — revisar manualmente`);
      continue;
    }
    inserts.push({ pos: start, text: "\n  const prisma = await getPrisma();" });
  }

  const arrowRegex =
    /(export\s+)?(const|let)\s+(\w+)\s*=\s*async\s*\([^)]*\)\s*(?::\s*[^=]+)?\s*=>\s*\{/g;
  while ((match = arrowRegex.exec(source)) !== null) {
    const start = match.index + match[0].length;
    const body = extractBlock(source, start - 1);
    if (!body.includes("prisma.")) continue;
    if (body.includes("await getPrisma()")) continue;
    inserts.push({ pos: start, text: "\n  const prisma = await getPrisma();" });
  }

  // Handlers export async function GET/POST sem nome de função explícito em route.ts
  const routeHandlerRegex = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\([^)]*\)\s*\{/g;
  while ((match = routeHandlerRegex.exec(source)) !== null) {
    const start = match.index + match[0].length;
    const body = extractBlock(source, start - 1);
    if (!body.includes("prisma.")) continue;
    if (body.includes("await getPrisma()")) continue;
    inserts.push({ pos: start, text: "\n  const prisma = await getPrisma();" });
  }

  inserts.sort((a, b) => b.pos - a.pos);
  for (const ins of inserts) {
    source = source.slice(0, ins.pos) + ins.text + source.slice(ins.pos);
  }

  // Top-level await em módulos (raro) — linha única em handlers já cobertos
  if (source.match(/^[^]*\bprisma\./m) && !source.includes("await getPrisma()")) {
    console.warn(`  ⚠ ${path}: ainda contém prisma. sem getPrisma — revisar`);
  }

  writeFileSync(path, source);
  return true;
}

function extractBlock(source, openBraceIndex) {
  let depth = 0;
  for (let i = openBraceIndex; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(openBraceIndex + 1, i);
    }
  }
  return "";
}

let changed = 0;
for (const file of files) {
  if (refactorFile(file)) {
    console.log(`✓ ${file}`);
    changed++;
  }
}
console.log(`\n${changed} arquivo(s) refatorado(s)`);
