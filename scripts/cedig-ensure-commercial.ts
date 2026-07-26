/**
 * Garante empresas + PricingRules CEDIG sem pacientes/histórico.
 * Uso: DATABASE_URL=file:/tmp/operation.db npx tsx scripts/cedig-ensure-commercial.ts
 */
import { PrismaClient } from "@prisma/client";
import { ensureCedigTenant } from "../prisma/seed-data/cedig-catalog";

const prisma = new PrismaClient();

async function main() {
  const result = await ensureCedigTenant(prisma, {
    seedHistory: false,
    portalMass: false,
    commercialLayer: true,
  });
  const tid = result.tenantId;
  console.log(
    JSON.stringify(
      {
        ...result,
        companies: await prisma.company.count({ where: { tenantId: tid } }),
        pricingRules: await prisma.pricingRule.count({
          where: { procedure: { tenantId: tid } },
        }),
        patients: await prisma.patient.count({ where: { tenantId: tid } }),
        appointments: await prisma.appointment.count({ where: { tenantId: tid } }),
        users: await prisma.user.count({ where: { tenantId: tid } }),
        pjUsers: await prisma.user.count({ where: { tenantId: tid, role: "PJ" } }),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
