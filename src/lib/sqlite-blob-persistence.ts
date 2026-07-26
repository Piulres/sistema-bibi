import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { DataStoreMode } from "@/lib/data-store-mode";
import { isLambdaSqliteRuntime } from "@/lib/database-env";
import { syncSqliteSchema } from "@/lib/operation/schema-sync";

const BLOB_STORE = "bibi-databases";
const OPERATION_BLOB_KEY = "operation.db";

const BUILD_DEMO_DB = join(process.cwd(), "prisma", "demo.db");
const BUILD_OPERATION_DB = join(process.cwd(), "prisma", "operation.db");
const LEGACY_BUILD_DB = join(process.cwd(), "prisma", "dev.db");

const TMP_DEMO_DB = "/tmp/bibi-demo.db";
const TMP_OPERATION_DB = "/tmp/bibi-operation.db";
/** Cópia gravável da referência de schema (o artefato de build fica em FS read-only na Lambda). */
const TMP_SCHEMA_REF_DB = "/tmp/bibi-operation-schema-ref.db";

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let persistInFlight: Promise<void> | null = null;
/** Versão do Blob já materializada em /tmp nesta instância Lambda. */
let localBlobUpdatedAt: string | null = null;
/** Última versão do banco em que o schema-sync rodou (evita reprocesso). */
let schemaSyncedVersion: string | null = null;

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

async function readOperationBlobUpdatedAt(): Promise<string | null> {
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: BLOB_STORE, consistency: "strong" });
    const meta = await store.getMetadata(OPERATION_BLOB_KEY);
    const updatedAt = meta?.metadata?.updatedAt;
    return typeof updatedAt === "string" ? updatedAt : null;
  } catch {
    return null;
  }
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

async function writeOperationToBlob(filePath: string): Promise<string | null> {
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: BLOB_STORE, consistency: "strong" });
    const buffer = readFileSync(filePath);
    const arrayBuffer = new ArrayBuffer(buffer.length);
    new Uint8Array(arrayBuffer).set(buffer);
    const updatedAt = new Date().toISOString();
    await store.set(OPERATION_BLOB_KEY, arrayBuffer, {
      metadata: { updatedAt },
    });
    return updatedAt;
  } catch {
    return null;
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

/**
 * O Blob de operação congela o schema da época do primeiro persist — `db push`
 * não roda na Lambda, então tabelas/colunas novas nunca chegariam à produção
 * (incidente: ClinicExamLaunch sem colunas da ponte v2.6 → 500 na gestão).
 * Aplica adições de schema usando o artefato de build como referência.
 * Se houve migração, faz flush imediato no Blob para o schema upgraded persistir.
 */
async function ensureOperationSchemaCurrent(activePath: string): Promise<void> {
  const buildArtifact = resolveBuildArtifact("operation");
  if (!existsSync(buildArtifact) || buildArtifact === activePath) return;

  const versionKey = `${activePath}:${localBlobUpdatedAt ?? "bootstrap"}`;
  if (schemaSyncedVersion === versionKey) return;

  try {
    // O artefato de build vive em FS read-only na Lambda; SQLite/Prisma pode
    // precisar de journal ao conectar, então lê a partir de uma cópia em /tmp.
    let referencePath = buildArtifact;
    if (isLambdaSqliteRuntime()) {
      copyFileSync(buildArtifact, TMP_SCHEMA_REF_DB);
      referencePath = TMP_SCHEMA_REF_DB;
    }
    const result = await syncSqliteSchema(activePath, referencePath);
    const mutated =
      result.createdTables.length > 0 ||
      result.addedColumns.length > 0 ||
      result.createdIndexes.length > 0;
    if (mutated || result.skipped.length > 0) {
      console.log("[operation-schema-sync]", JSON.stringify(result));
    }
    schemaSyncedVersion = versionKey;
    // Persiste o schema upgraded no Blob — senão o próximo cold start
    // rebaixa para o schema antigo e re-migra a cada instância.
    if (mutated && isLambdaSqliteRuntime()) {
      await persistOperationDatabaseNow();
      schemaSyncedVersion = `${activePath}:${localBlobUpdatedAt ?? "bootstrap"}`;
    }
  } catch (error) {
    // Não bloquear o boot — sem o sync, o comportamento volta ao anterior.
    console.error("[operation-schema-sync] falha ao migrar schema:", error);
  }
}

async function ensureLambdaOperationDb(): Promise<string> {
  const synced = await syncOperationDatabaseFromBlob();
  if (existsSync(TMP_OPERATION_DB)) {
    void synced;
    await ensureOperationSchemaCurrent(TMP_OPERATION_DB);
    return TMP_OPERATION_DB;
  }

  const bootstrap = resolveBuildArtifact("operation");
  copyIfNewer(bootstrap, TMP_OPERATION_DB);
  await ensureOperationSchemaCurrent(TMP_OPERATION_DB);
  return TMP_OPERATION_DB;
}

/**
 * Rehidrata `/tmp` a partir do Blob se houver versão mais nova.
 * Não sobrescreve enquanto houver persistência pendente (evita perder writes locais).
 * @returns true se o arquivo local foi substituído
 */
export async function syncOperationDatabaseFromBlob(): Promise<boolean> {
  if (!isLambdaSqliteRuntime()) return false;

  if (persistInFlight || persistTimer) {
    return false;
  }

  const remoteUpdatedAt = await readOperationBlobUpdatedAt();
  if (
    existsSync(TMP_OPERATION_DB) &&
    remoteUpdatedAt &&
    remoteUpdatedAt === localBlobUpdatedAt
  ) {
    return false;
  }

  const fromBlob = await readOperationFromBlob();
  if (!fromBlob) {
    return false;
  }

  const hadLocal = existsSync(TMP_OPERATION_DB);
  const previousSize = hadLocal ? readFileSync(TMP_OPERATION_DB).length : -1;
  writeFileSync(TMP_OPERATION_DB, fromBlob);
  localBlobUpdatedAt = remoteUpdatedAt ?? `size:${fromBlob.length}`;
  return !hadLocal || previousSize !== fromBlob.length || remoteUpdatedAt !== null;
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
    const updatedAt = await writeOperationToBlob(TMP_OPERATION_DB);
    if (updatedAt) {
      localBlobUpdatedAt = updatedAt;
    }
  })();

  try {
    await persistInFlight;
  } finally {
    persistInFlight = null;
  }
}

/**
 * Cancela o debounce e grava o Blob imediatamente.
 * Usar após mutações — evita perder cadastro se a Lambda encerrar antes do timer.
 */
export async function flushOperationDatabasePersist(): Promise<void> {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  await persistOperationDatabaseNow();
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
