import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { isTestSeedStale } from "./seed-fixtures";

const TEST_DB_PATH = join(process.cwd(), "prisma", "test.db");
  const TEST_DATABASE_URL = `file:${TEST_DB_PATH}?mode=rwc`;

let testPrisma: PrismaClient | undefined;

/** Garante SQLite isolado para integração/API sem tocar no dev.db local. */
export async function ensureTestDatabase(): Promise<void> {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.DUAL_DATA_STORE = "false";

  const firstCreate = !existsSync(TEST_DB_PATH);

  execSync("npx prisma db push --skip-generate", {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "pipe",
  });

  const prisma = new PrismaClient({
    datasources: { db: { url: TEST_DATABASE_URL } },
  });
  const tenantCount = await prisma.tenant.count();
  await prisma.$disconnect();

  const stale = !firstCreate && tenantCount > 0 && (await isTestSeedStale(TEST_DATABASE_URL));
  if (stale && existsSync(TEST_DB_PATH)) {
    unlinkSync(TEST_DB_PATH);
    execSync("npx prisma db push --skip-generate", {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: "pipe",
    });
  }

  const needsSeed = firstCreate || stale || tenantCount === 0;
  if (needsSeed) {
    execSync("npx prisma db seed", {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL, SEED_SCALE: "small" },
      stdio: "pipe",
    });
  }
}

export function getTestPrisma(): PrismaClient {
  if (!testPrisma) {
    testPrisma = new PrismaClient({
      datasources: { db: { url: TEST_DATABASE_URL } },
    });
  }
  return testPrisma;
}

export async function disconnectTestPrisma(): Promise<void> {
  await testPrisma?.$disconnect();
  testPrisma = undefined;
}
