#!/usr/bin/env node
/**
 * Valida integridade de demo.db e operation.db após bootstrap/seed.
 * Uso: npm run db:verify
 */
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const root = process.cwd();
const prismaDir = join(root, "prisma");
const demoDb = join(prismaDir, "demo.db");
const operationDb = join(prismaDir, "operation.db");
const legacyDb = join(prismaDir, "dev.db");

const DEMO_SLUGS = ["horizonte", "vitacare", "petcare", "smile", "lex", "zen", "eduprime"];
const DEMO_EMAILS = [
  "faturamento@bibi.health",
  "dra.helena@bibi.health",
  "operacao@petcare.demo",
  "joao.pereira@email.com",
  "rh@techcorp.com",
];
const OPERATION_SLUGS = ["bibi-saude", "cedig"];
const OPERATION_EMAILS = [
  "dra.helena@bibi.health",
  "faturamento@bibi.health",
  "recepcao@bibi.health",
  "financeiro@bibi.health",
  "seguranca@bibi.health",
  "alana@cedig.demo",
  "operacao@cedig.demo",
];
const MIN_PROCEDURES_OPERATION = 14;

const errors = [];

function resolveMinCompanies() {
  const profile = (process.env.SEED_PROFILE ?? "market").toLowerCase();
  if (profile === "operation-1y" || profile === "operation_1y" || profile === "operation1y") {
    return 20;
  }
  return 50;
}

function clientFor(file) {
  return new PrismaClient({
    datasources: { db: { url: `file:${file}` } },
  });
}

async function verifyDemo() {
  const prisma = clientFor(demoDb);
  try {
    const tenants = await prisma.tenant.findMany({ select: { slug: true, niche: true } });
    const slugs = new Set(tenants.map((t) => t.slug).filter(Boolean));
    for (const slug of DEMO_SLUGS) {
      if (!slugs.has(slug)) errors.push(`demo.db: falta tenant slug "${slug}"`);
    }

    const emptySlug = tenants.filter((t) => !t.slug?.trim()).length;
    if (emptySlug > 0) errors.push(`demo.db: ${emptySlug} tenant(s) com slug vazio`);

    for (const email of DEMO_EMAILS) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) errors.push(`demo.db: usuário demo ausente: ${email}`);
    }

    const minCompanies = resolveMinCompanies();
    const companies = await prisma.company.count();
    const patients = await prisma.patient.count();
    if (companies < minCompanies) {
      errors.push(`demo.db: esperado ≥${minCompanies} empresas PJ, encontrado ${companies}`);
    }
    if (patients < 100) errors.push(`demo.db: massa de beneficiários baixa (${patients})`);

    const horizonte = await prisma.tenant.findFirst({
      where: { slug: "horizonte" },
      select: { niche: true },
    });
    if (horizonte?.niche !== "MEDICAL") {
      errors.push(`demo.db: tenant horizonte deve ser MEDICAL`);
    }

    const petcare = await prisma.tenant.findFirst({
      where: { slug: "petcare" },
      include: { users: { where: { email: "operacao@petcare.demo" } } },
    });
    if (!petcare?.users.length) {
      errors.push(`demo.db: operacao@petcare.demo não vinculado ao tenant petcare`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyOperation() {
  const prisma = clientFor(operationDb);
  try {
    const tenants = await prisma.tenant.findMany({ select: { slug: true, niche: true, name: true } });
    const slugs = new Set(tenants.map((t) => t.slug).filter(Boolean));
    if (tenants.length !== OPERATION_SLUGS.length) {
      errors.push(
        `operation.db: esperado ${OPERATION_SLUGS.length} tenants (bootstrap), encontrado ${tenants.length}`,
      );
    }
    for (const slug of OPERATION_SLUGS) {
      if (!slugs.has(slug)) {
        errors.push(`operation.db: falta tenant slug "${slug}"`);
      }
    }
    for (const tenant of tenants) {
      if (tenant.niche !== "MEDICAL") {
        errors.push(`operation.db: tenant ${tenant.slug} deve ser MEDICAL`);
      }
    }

    for (const email of OPERATION_EMAILS) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) errors.push(`operation.db: usuário ausente: ${email}`);
    }

    const procedures = await prisma.procedure.count();
    if (procedures < MIN_PROCEDURES_OPERATION) {
      errors.push(`operation.db: esperado ≥${MIN_PROCEDURES_OPERATION} procedimentos, encontrado ${procedures}`);
    }

    const companies = await prisma.company.findMany({ select: { name: true, tenantId: true } });
    const patients = await prisma.patient.count();
    // CEDIG em operação pode ter até 3 empresas institucionais (convênio) — sem pacientes demo.
    const allowedCedigCompanies = new Set(["CentralMed", "Bem Saúde", "Dr Saúde"]);
    const unexpected = companies.filter((c) => !allowedCedigCompanies.has(c.name));
    if (unexpected.length > 0) {
      errors.push(
        `operation.db: empresas fora do bootstrap CEDIG: ${unexpected.map((c) => c.name).join(", ")}`,
      );
    }
    if (companies.length > 3) {
      errors.push(`operation.db: esperado ≤3 empresas CEDIG, encontrado ${companies.length}`);
    }
    if (patients > 0) {
      errors.push(`operation.db: não deve ter pacientes na massa inicial (${patients})`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

function verifyLegacyMirror() {
  if (!existsSync(legacyDb)) {
    errors.push("dev.db ausente — rode npm run db:bootstrap:demo");
    return;
  }
  const demoSize = statSync(demoDb).size;
  const devSize = statSync(legacyDb).size;
  if (demoSize !== devSize) {
    errors.push(`dev.db (${devSize} bytes) não espelha demo.db (${demoSize} bytes)`);
  }
}

async function main() {
  for (const file of [demoDb, operationDb]) {
    if (!existsSync(file)) {
      errors.push(`Arquivo ausente: ${file} — rode npm run db:bootstrap:demo`);
    }
  }
  if (errors.length) {
    console.error("db:verify falhou:\n");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  await verifyDemo();
  await verifyOperation();
  verifyLegacyMirror();

  if (errors.length) {
    console.error("db:verify falhou:\n");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log("db:verify OK — demo.db (massa completa) e operation.db (bootstrap) consistentes.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
