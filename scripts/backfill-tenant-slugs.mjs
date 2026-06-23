/**
 * Preenche slug em tenants existentes (migração v2.0 multi-segmento).
 * Uso: node scripts/backfill-tenant-slugs.mjs
 */
import { PrismaClient } from "@prisma/client";

const SLUG_BY_CNPJ = {
  "12.345.678/0001-90": "horizonte",
  "99.888.777/0001-11": "vitacare",
  "11.111.111/0001-11": "petcare",
  "22.222.222/0001-22": "smile",
  "33.333.333/0001-33": "lex",
  "44.444.444/0001-44": "zen",
  "55.555.555/0001-55": "eduprime",
};

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({ select: { id: true, cnpj: true, slug: true } });
  let updated = 0;
  for (const tenant of tenants) {
    if (tenant.slug) continue;
    const slug = SLUG_BY_CNPJ[tenant.cnpj];
    if (!slug) {
      console.warn(`Sem slug mapeado para CNPJ ${tenant.cnpj}`);
      continue;
    }
    await prisma.tenant.update({ where: { id: tenant.id }, data: { slug } });
    updated += 1;
    console.log(`  ${tenant.cnpj} → ${slug}`);
  }
  console.log(`Backfill concluído: ${updated} tenant(s) atualizado(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
