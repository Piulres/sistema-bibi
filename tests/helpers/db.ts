import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { isTestSeedStale } from "./seed-fixtures";

const TEST_DB_PATH = join(process.cwd(), "prisma", "test.db");
  const TEST_DATABASE_URL = `file:${TEST_DB_PATH}?mode=rwc`;
const READY_MARKER_PATH = join(process.cwd(), "prisma", ".test-db-ready");

let testPrisma: PrismaClient | undefined;

/**
 * Remove o marker — usado pelo globalSetup para forçar o caminho completo
 * (staleness + seed) uma vez por execução, antes dos workers.
 */
export function resetTestDatabaseMarker(): void {
  if (existsSync(READY_MARKER_PATH)) {
    unlinkSync(READY_MARKER_PATH);
  }
}

/** Fingerprint de schema + massa — invalida o marker quando o seed muda. */
function testDbFingerprint(): string {
  const hash = createHash("sha256");
  hash.update(readFileSync(join(process.cwd(), "prisma", "schema.prisma")));
  hash.update(readFileSync(join(process.cwd(), "prisma", "seed.ts")));
  const seedDir = join(process.cwd(), "prisma", "seed-data");
  for (const entry of readdirSync(seedDir).sort()) {
    const stat = statSync(join(seedDir, entry));
    hash.update(`${entry}:${stat.size}:${stat.mtimeMs};`);
  }
  return hash.digest("hex");
}

/**
 * Garante SQLite isolado para integração/API sem tocar no dev.db local.
 *
 * O `globalSetup` roda o caminho completo (db push + staleness + seed) antes
 * dos workers e grava `prisma/.test-db-ready`. O `beforeAll` de cada arquivo
 * (tests/setup.ts) cai no caminho rápido — sem subprocesso `prisma db push`
 * por suíte, que estourava o hookTimeout em runners lentos de CI.
 */
export async function ensureTestDatabase(): Promise<void> {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.DUAL_DATA_STORE = "false";

  if (existsSync(TEST_DB_PATH) && existsSync(READY_MARKER_PATH)) {
    try {
      if (readFileSync(READY_MARKER_PATH, "utf8") === testDbFingerprint()) {
        return;
      }
    } catch {
      // marker ilegível — segue caminho completo
    }
  }

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

  writeFileSync(READY_MARKER_PATH, testDbFingerprint(), "utf8");
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
