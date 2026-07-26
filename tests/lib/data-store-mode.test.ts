import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  getDataStoreMode,
  invalidateDataStoreModeCache,
  isDualDataStoreEnabled,
  parseDataStoreMode,
  setDataStoreMode,
} from "@/lib/data-store-mode";

const LOCAL_MODE_FILE = join(process.cwd(), "prisma", ".data-store-mode");

describe("data-store-mode", () => {
  const envBackup: Record<string, string | undefined> = {};
  // Preserva o estado do arquivo local: o teste grava "operation" e, se não
  // restaurar, o dev local passa a apontar para operation.db (vazio) → 500 no login.
  const localModeBackup = existsSync(LOCAL_MODE_FILE)
    ? readFileSync(LOCAL_MODE_FILE, "utf8")
    : null;

  afterEach(() => {
    for (const key of [
      "DUAL_DATA_STORE",
      "DATA_STORE_MODE",
      "DATABASE_URL",
      "NETLIFY",
      "VITEST",
      "NODE_ENV",
    ]) {
      if (envBackup[key] === undefined) delete process.env[key];
      else process.env[key] = envBackup[key];
    }
    invalidateDataStoreModeCache();
    if (localModeBackup === null) {
      rmSync(LOCAL_MODE_FILE, { force: true });
    } else {
      writeFileSync(LOCAL_MODE_FILE, localModeBackup, "utf8");
    }
  });

  function setEnv(key: string, value: string | undefined) {
    if (!(key in envBackup)) envBackup[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  it("parseia modos demo e operacao", () => {
    expect(parseDataStoreMode("demo")).toBe("demo");
    expect(parseDataStoreMode("operation")).toBe("operation");
    expect(parseDataStoreMode("operacao")).toBe("operation");
    expect(parseDataStoreMode("invalid")).toBeNull();
  });

  it("desliga dual-store em testes", () => {
    setEnv("DATABASE_URL", "file:./test.db");
    setEnv("VITEST", "true");
    expect(isDualDataStoreEnabled()).toBe(false);
  });

  it("habilita dual-store em desenvolvimento", () => {
    setEnv("DATABASE_URL", "file:./dev.db");
    setEnv("NODE_ENV", "development");
    delete process.env.VITEST;
    expect(isDualDataStoreEnabled()).toBe(true);
  });

  it("persiste modo em arquivo local quando Blobs indisponível", async () => {
    setEnv("DATABASE_URL", "file:./dev.db");
    setEnv("NODE_ENV", "development");
    setEnv("DUAL_DATA_STORE", "true");
    delete process.env.VITEST;

    await setDataStoreMode("operation");
    invalidateDataStoreModeCache();
    expect(await getDataStoreMode()).toBe("operation");
  });
});
