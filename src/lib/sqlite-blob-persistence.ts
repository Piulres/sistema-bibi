import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { DataStoreMode } from "@/lib/data-store-mode";
import { isLambdaSqliteRuntime } from "@/lib/database-env";

const BLOB_STORE = "bibi-databases";
const OPERATION_BLOB_KEY = "operation.db";

const BUILD_DEMO_DB = join(process.cwd(), "prisma", "demo.db");
const BUILD_OPERATION_DB = join(process.cwd(), "prisma", "operation.db");
const LEGACY_BUILD_DB = join(process.cwd(), "prisma", "dev.db");

const TMP_DEMO_DB = "/tmp/bibi-demo.db";
const TMP_OPERATION_DB = "/tmp/bibi-operation.db";

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let persistInFlight: Promise<void> | null = null;

function resolveBuildArtifact(mode: DataStoreMode): string {
  if (mode === "demo") {
    if (existsSync(BUILD_DEMO_DB)) return BUILD_DEMO_DB;
    return LEGACY_BUILD_DB;
  }
  if (existsSync(BUILD_OPERATION_DB)) return BUILD_OPERATION_DB;
  return BUILD_DEMO_DB;
}

function localRuntimePath(mode: DataStoreMode): string {
  if (mode === "demo") {
    if (existsSync(BUILD_DEMO_DB)) return BUILD_DEMO_DB;
    return LEGACY_BUILD_DB;
  }
  if (existsSync(BUILD_OPERATION_DB)) return BUILD_OPERATION_DB;
  return join(process.cwd(), "prisma", "operation.db");
}

async function readOperationFromBlob(): Promise<Buffer | null> {
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: BLOB_STORE, consistency: "strong" });
    const result = await store.get(OPERATION_BLOB_KEY, { type: "arrayBuffer" });
    if (!result) return null;
    return Buffer.from(result as ArrayBuffer);
  } catch {
    return null;
  }
}

async function writeOperationToBlob(filePath: string): Promise<boolean> {
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: BLOB_STORE, consistency: "strong" });
    const buffer = readFileSync(filePath);
    const arrayBuffer = new ArrayBuffer(buffer.length);
    new Uint8Array(arrayBuffer).set(buffer);
    await store.set(OPERATION_BLOB_KEY, arrayBuffer, {
      metadata: { updatedAt: new Date().toISOString() },
    });
    return true;
  } catch {
    return false;
  }
}

function copyIfNewer(source: string, target: string): void {
  if (!existsSync(source)) {
    throw new Error(`Arquivo SQLite de build ausente: ${source}`);
  }
  if (!existsSync(target)) {
    copyFileSync(source, target);
    return;
  }
  const sourceStat = readFileSync(source);
  const targetStat = readFileSync(target);
  if (sourceStat.length !== targetStat.length) {
    copyFileSync(source, target);
  }
}

async function ensureLambdaDemoDb(): Promise<string> {
  copyIfNewer(resolveBuildArtifact("demo"), TMP_DEMO_DB);
  return TMP_DEMO_DB;
}

async function ensureLambdaOperationDb(): Promise<string> {
  const fromBlob = await readOperationFromBlob();
  if (fromBlob) {
    writeFileSync(TMP_OPERATION_DB, fromBlob);
    return TMP_OPERATION_DB;
  }

  const bootstrap = resolveBuildArtifact("operation");
  copyIfNewer(bootstrap, TMP_OPERATION_DB);
  return TMP_OPERATION_DB;
}

/** Resolve o caminho absoluto do arquivo SQLite para o modo informado. */
export async function ensureSqliteDatabasePath(mode: DataStoreMode): Promise<string> {
  if (!isLambdaSqliteRuntime()) {
    return localRuntimePath(mode);
  }

  if (mode === "demo") {
    return ensureLambdaDemoDb();
  }

  return ensureLambdaOperationDb();
}

/** Persiste o banco de operação em Netlify Blobs (somente Lambda + modo operation). */
export async function persistOperationDatabaseNow(): Promise<void> {
  if (!isLambdaSqliteRuntime() || !existsSync(TMP_OPERATION_DB)) {
    return;
  }

  if (persistInFlight) {
    await persistInFlight;
    return;
  }

  persistInFlight = (async () => {
    await writeOperationToBlob(TMP_OPERATION_DB);
  })();

  try {
    await persistInFlight;
  } finally {
    persistInFlight = null;
  }
}

/** Agenda persistência debounced após escritas no banco de operação. */
export function scheduleOperationDatabasePersist(): void {
  if (!isLambdaSqliteRuntime()) return;

  if (persistTimer) {
    clearTimeout(persistTimer);
  }

  persistTimer = setTimeout(() => {
    persistTimer = null;
    void persistOperationDatabaseNow();
  }, 1500);
}

export function isSqliteWriteAction(action: string): boolean {
  return (
    action === "create" ||
    action === "createMany" ||
    action === "update" ||
    action === "updateMany" ||
    action === "upsert" ||
    action === "delete" ||
    action === "deleteMany"
  );
}

/** Caminho usado em runtime Lambda para operação (útil em testes). */
export function getLambdaOperationDbPath(): string {
  return TMP_OPERATION_DB;
}

/** Garante diretório prisma no bootstrap local. */
export function ensurePrismaDir(): void {
  mkdirSync(join(process.cwd(), "prisma"), { recursive: true });
}
