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
const OPERATION_SLUG = "bibi-saude";
const OPERATION_EMAILS = [
  "dra.helena@bibi.health",
  "faturamento@bibi.health",
  "recepcao@bibi.health",
  "financeiro@bibi.health",
  "seguranca@bibi.health",
];
const MIN_PROCEDURES_OPERATION = 14;

const errors = [];

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

    const companies = await prisma.company.count();
    const patients = await prisma.patient.count();
    if (companies < 50) errors.push(`demo.db: esperado ≥50 empresas PJ, encontrado ${companies}`);
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
    if (tenants.length !== 1) {
      errors.push(`operation.db: esperado 1 tenant (bootstrap), encontrado ${tenants.length}`);
    }
    const tenant = tenants[0];
    if (tenant?.slug !== OPERATION_SLUG) {
      errors.push(`operation.db: slug esperado "${OPERATION_SLUG}", encontrado "${tenant?.slug ?? "null"}"`);
    }
    if (tenant?.niche !== "MEDICAL") {
      errors.push(`operation.db: tenant operação deve ser MEDICAL`);
    }

    for (const email of OPERATION_EMAILS) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) errors.push(`operation.db: usuário ausente: ${email}`);
    }

    const procedures = await prisma.procedure.count();
    if (procedures < MIN_PROCEDURES_OPERATION) {
      errors.push(`operation.db: esperado ≥${MIN_PROCEDURES_OPERATION} procedimentos, encontrado ${procedures}`);
    }

    const companies = await prisma.company.count();
    const patients = await prisma.patient.count();
    if (companies > 0) {
      errors.push(`operation.db: não deve ter empresas PJ na massa inicial (${companies})`);
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
