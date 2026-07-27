import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  isLambdaSqliteRuntime,
  isPostgresDatabaseUrl,
  isSqliteDatabaseUrl,
} from "@/lib/database-env";
import { getDataStoreMode, isDualDataStoreEnabled, type DataStoreMode } from "@/lib/data-store-mode";
import {
  ensureSqliteDatabasePath,
  flushOperationDatabasePersist,
  isSqliteWriteAction,
  persistOperationDatabaseNow,
  syncOperationDatabaseFromBlob,
} from "@/lib/sqlite-blob-persistence";
import {
  runWithSqliteTransactionTracking,
  shouldFlushSqliteWriteAfterOperation,
} from "@/lib/sqlite-transaction-flush";

type PrismaCache = {
  mode: DataStoreMode | "postgres" | "sqlite-legacy";
  client: PrismaClient;
};

let prismaCache: PrismaCache | null = null;
let initPromise: Promise<PrismaClient> | null = null;

function resolveLegacySqlitePath(configured: string): string {
  if (!configured.startsWith("file:")) return configured;

  const pathPart = configured.slice("file:".length);
  if (!pathPart.startsWith("./")) return configured;

  const relative = pathPart.slice(2);
  if (relative.startsWith("prisma/")) {
    return `file:${join(process.cwd(), relative)}`;
  }
  return `file:${join(process.cwd(), "prisma", relative)}`;
}

/**
 * Em Lambda + operation: persiste o SQLite no Blob após writes.
 * Nunca no meio de `$transaction` — só após COMMIT (settle).
 */
function withOperationBlobFlush(base: PrismaClient): PrismaClient {
  const extended = base.$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, query, args }) {
          const result = await query(args);
          if (
            shouldFlushSqliteWriteAfterOperation(operation, isSqliteWriteAction(operation))
          ) {
            // Flush imediato fora de tx: debounce perdia creates se a Lambda encerrasse cedo.
            await flushOperationDatabasePersist();
          }
          return result;
        },
      },
    },
  }) as unknown as PrismaClient;

  const originalTransaction = extended.$transaction.bind(extended) as (
    ...args: unknown[]
  ) => Promise<unknown>;

  (extended as { $transaction: (...args: unknown[]) => Promise<unknown> }).$transaction = (
    ...args: unknown[]
  ) =>
    runWithSqliteTransactionTracking(
      () => originalTransaction(...args),
      () => flushOperationDatabasePersist(),
    );

  return extended;
}

async function createPrismaClient(databaseUrl: string, modeKey: PrismaCache["mode"]): Promise<PrismaClient> {
  process.env.DATABASE_URL = databaseUrl;

  const base = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  if (modeKey === "operation" && isLambdaSqliteRuntime()) {
    return withOperationBlobFlush(base);
  }

  return base;
}

async function resolveDatabaseUrl(): Promise<{ url: string; modeKey: PrismaCache["mode"] }> {
  const configured = process.env.DATABASE_URL;
  if (!configured) {
    throw new Error("DATABASE_URL não configurado");
  }

  if (isPostgresDatabaseUrl(configured)) {
    return { url: configured, modeKey: "postgres" };
  }

  if (!isSqliteDatabaseUrl(configured)) {
    return { url: configured, modeKey: "sqlite-legacy" };
  }

  if (!isDualDataStoreEnabled()) {
    return { url: resolveLegacySqlitePath(configured), modeKey: "sqlite-legacy" };
  }

  const mode = await getDataStoreMode();
  const sqlitePath = await ensureSqliteDatabasePath(mode);
  return { url: `file:${sqlitePath}`, modeKey: mode };
}

async function initPrisma(): Promise<PrismaClient> {
  if (prismaCache) {
    return prismaCache.client;
  }

  const { url, modeKey } = await resolveDatabaseUrl();
  const client = await createPrismaClient(url, modeKey);
  prismaCache = { mode: modeKey, client };
  return client;
}

/** Cliente Prisma do modo ativo (demo ou operação). */
export async function getPrisma(): Promise<PrismaClient> {
  if (prismaCache && !isDualDataStoreEnabled()) {
    return prismaCache.client;
  }

  const mode = await getDataStoreMode();

  // Operação na Lambda: rehidrata do Blob se outra instância gravou (ex.: prestador criado).
  if (mode === "operation" && isLambdaSqliteRuntime()) {
    const refreshed = await syncOperationDatabaseFromBlob();
    if (refreshed && prismaCache) {
      await prismaCache.client.$disconnect();
      prismaCache = null;
    }
  }

  if (prismaCache?.mode === mode || (prismaCache?.mode === "postgres" && isPostgresDatabaseUrl())) {
    return prismaCache.client;
  }

  if (prismaCache) {
    await prismaCache.client.$disconnect();
    prismaCache = null;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = initPrisma().finally(() => {
    initPromise = null;
  });

  return initPromise;
}

/** Invalida cache ao trocar demo ↔ operação. */
export async function invalidatePrismaCache(options?: { persistOperation?: boolean }): Promise<void> {
  if (options?.persistOperation && prismaCache?.mode === "operation") {
    await persistOperationDatabaseNow();
  }

  if (prismaCache) {
    await prismaCache.client.$disconnect();
    prismaCache = null;
  }
}

/** Compatibilidade legada — preferir getPrisma(). */
export async function prismaClient(): Promise<PrismaClient> {
  return getPrisma();
}

// Dev sem dual-store: inicialização síncrona legada para hot reload estável.
const globalForPrisma = globalThis as unknown as {
  legacyPrisma: PrismaClient | undefined;
};

if (
  process.env.NODE_ENV === "development" &&
  !isLambdaSqliteRuntime() &&
  process.env.DUAL_DATA_STORE === "false"
) {
  const configured = process.env.DATABASE_URL;
  if (configured && isSqliteDatabaseUrl(configured) && !isPostgresDatabaseUrl(configured)) {
    const url = resolveLegacySqlitePath(configured);
    process.env.DATABASE_URL = url;
    const legacy =
      globalForPrisma.legacyPrisma ??
      new PrismaClient({
        log: ["error", "warn"],
      });
    globalForPrisma.legacyPrisma = legacy;
    prismaCache = { mode: "sqlite-legacy", client: legacy };
  }
}
