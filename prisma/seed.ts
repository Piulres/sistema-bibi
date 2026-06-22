import { PrismaClient } from "@prisma/client";
import { runDatabaseSeed } from "./seed-data/run-seed";

const prisma = new PrismaClient();

async function main() {
  await runDatabaseSeed(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
