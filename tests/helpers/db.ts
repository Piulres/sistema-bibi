import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const TEST_DB_PATH = join(process.cwd(), "prisma", "test.db");
const TEST_DATABASE_URL = `file:${TEST_DB_PATH}`;

let testPrisma: PrismaClient | undefined;

/** Garante SQLite isolado para integração/API sem tocar no dev.db local. */
export async function ensureTestDatabase(): Promise<void> {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.DUAL_DATA_STORE = "false";

  if (!existsSync(TEST_DB_PATH)) {
    execSync("npx prisma db push --skip-generate", {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: "pipe",
    });
    execSync("npx prisma db seed", {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
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
