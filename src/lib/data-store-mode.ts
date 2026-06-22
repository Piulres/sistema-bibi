import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isSqliteDatabaseUrl } from "@/lib/database-env";

export type DataStoreMode = "demo" | "operation";

const BLOB_STORE = "bibi-config";
const BLOB_KEY = "data-store-mode";
const LOCAL_MODE_FILE = join(process.cwd(), "prisma", ".data-store-mode");

let cachedMode: DataStoreMode | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 5_000;

export function parseDataStoreMode(value: unknown): DataStoreMode | null {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (raw === "demo") return "demo";
  if (raw === "operation" || raw === "operacao" || raw === "prod") return "operation";
  return null;
}

export function isDualDataStoreEnabled(): boolean {
  if (!isSqliteDatabaseUrl()) return false;
  if (process.env.VITEST === "true") return false;
  const url = process.env.DATABASE_URL ?? "";
  if (url.includes("test.db")) return false;
  const flag = process.env.DUAL_DATA_STORE?.trim().toLowerCase();
  if (flag === "false" || flag === "0" || flag === "no") return false;
  if (flag === "true" || flag === "1" || flag === "yes") return true;
  return process.env.NETLIFY === "true" || process.env.NODE_ENV === "development";
}

function readLocalModeFile(): DataStoreMode | null {
  if (!existsSync(LOCAL_MODE_FILE)) return null;
  try {
    const parsed = parseDataStoreMode(readFileSync(LOCAL_MODE_FILE, "utf8"));
    return parsed;
  } catch {
    return null;
  }
}

function writeLocalModeFile(mode: DataStoreMode): void {
  mkdirSync(join(process.cwd(), "prisma"), { recursive: true });
  writeFileSync(LOCAL_MODE_FILE, mode, "utf8");
}

async function readModeFromBlob(): Promise<DataStoreMode | null> {
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: BLOB_STORE, consistency: "strong" });
    const value = await store.get(BLOB_KEY, { type: "text" });
    return parseDataStoreMode(value);
  } catch {
    return null;
  }
}

async function writeModeToBlob(mode: DataStoreMode): Promise<boolean> {
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: BLOB_STORE, consistency: "strong" });
    await store.set(BLOB_KEY, mode);
    return true;
  } catch {
    return false;
  }
}

function defaultMode(): DataStoreMode {
  const fromEnv = parseDataStoreMode(process.env.DATA_STORE_MODE);
  if (fromEnv) return fromEnv;

  const appMode = process.env.APP_MODE?.trim().toLowerCase();
  if (appMode === "operation" || appMode === "operacao" || appMode === "prod") {
    return "operation";
  }

  return "demo";
}

/** Modo ativo do site (demo = massa de teste, operation = dados reais). */
export async function getDataStoreMode(): Promise<DataStoreMode> {
  if (!isDualDataStoreEnabled()) {
    return defaultMode();
  }

  const now = Date.now();
  if (cachedMode && now < cacheExpiresAt) {
    return cachedMode;
  }

  const fromBlob = await readModeFromBlob();
  const fromFile = readLocalModeFile();
  const mode = fromBlob ?? fromFile ?? defaultMode();

  cachedMode = mode;
  cacheExpiresAt = now + CACHE_TTL_MS;
  return mode;
}

export function invalidateDataStoreModeCache(): void {
  cachedMode = null;
  cacheExpiresAt = 0;
}

/** Altera o modo ativo (persiste em Blobs ou arquivo local). */
export async function setDataStoreMode(mode: DataStoreMode): Promise<void> {
  invalidateDataStoreModeCache();

  const savedToBlob = await writeModeToBlob(mode);
  if (!savedToBlob) {
    writeLocalModeFile(mode);
  } else if (existsSync(LOCAL_MODE_FILE)) {
    writeLocalModeFile(mode);
  }

  cachedMode = mode;
  cacheExpiresAt = Date.now() + CACHE_TTL_MS;
}

export type DataStoreStatus = {
  mode: DataStoreMode;
  dualStoreEnabled: boolean;
  persistence: "netlify-blobs" | "local-file" | "env-only";
  demoResetAvailable: boolean;
};

export async function getDataStoreStatus(): Promise<DataStoreStatus> {
  const mode = await getDataStoreMode();
  const dualStoreEnabled = isDualDataStoreEnabled();

  let persistence: DataStoreStatus["persistence"] = "env-only";
  if (dualStoreEnabled) {
    const blobMode = await readModeFromBlob();
    persistence = blobMode !== null ? "netlify-blobs" : "local-file";
  }

  return {
    mode,
    dualStoreEnabled,
    persistence,
    demoResetAvailable: mode === "demo",
  };
}
