import { afterEach, describe, expect, it } from "vitest";
import {
  databaseEnvSummary,
  getAppMode,
  isDemoResetAllowed,
  isPostgresDatabaseUrl,
  shouldSeedOnBuild,
} from "@/lib/database-env";

describe("database-env", () => {
  const envBackup: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const key of ["APP_MODE", "RUN_SEED_ON_BUILD", "ALLOW_DEMO_RESET", "DATABASE_URL", "NETLIFY", "NODE_ENV"]) {
      if (envBackup[key] === undefined) delete process.env[key];
      else process.env[key] = envBackup[key];
    }
  });

  function setEnv(key: string, value: string | undefined) {
    if (!(key in envBackup)) envBackup[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  it("modo demo por padrao", () => {
    delete process.env.APP_MODE;
    expect(getAppMode()).toBe("demo");
  });

  it("modo operacao desliga seed e reset", () => {
    setEnv("APP_MODE", "operation");
    setEnv("NETLIFY", "true");
    setEnv("ALLOW_DEMO_RESET", "true");
    expect(shouldSeedOnBuild()).toBe(false);
    expect(isDemoResetAllowed()).toBe(false);
  });

  it("RUN_SEED_ON_BUILD=false em demo", () => {
    setEnv("APP_MODE", "demo");
    setEnv("RUN_SEED_ON_BUILD", "false");
    expect(shouldSeedOnBuild()).toBe(false);
  });

  it("detecta postgres URL", () => {
    expect(isPostgresDatabaseUrl("postgresql://user:pass@host/db")).toBe(true);
    expect(isPostgresDatabaseUrl("file:./dev.db")).toBe(false);
  });

  it("resume ambiente", () => {
    setEnv("APP_MODE", "demo");
    setEnv("DATABASE_URL", "file:./dev.db");
    const s = databaseEnvSummary();
    expect(s.appMode).toBe("demo");
    expect(s.provider).toBe("sqlite");
    expect(s.seedOnBuild).toBe(true);
  });
});
