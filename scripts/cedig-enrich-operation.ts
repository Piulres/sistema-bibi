import { PrismaClient } from "@prisma/client";
import { ensureCedigTenant } from "../prisma/seed-data/cedig-catalog";

const prisma = new PrismaClient();

async function main() {
  const r = await ensureCedigTenant(prisma, {
    portalMass: true,
    commercialLayer: true,
    seedHistory: true,
  });
  const patients = await prisma.patient.count({ where: { tenantId: r.tenantId } });
  const pj = await prisma.user.count({ where: { tenantId: r.tenantId, role: "PJ" } });
  const ben = await prisma.user.count({
    where: { tenantId: r.tenantId, role: "BENEFICIARIO" },
  });
  const appts = await prisma.appointment.count({ where: { tenantId: r.tenantId } });
  console.log(JSON.stringify({ ...r, patients, pj, ben, appts }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
