/** Detecção de modo demo vs operação e tipo de banco — usado em build, runtime e reset. */

export type AppMode = "demo" | "operation";

export function getAppMode(): AppMode {
  const raw = process.env.APP_MODE?.trim().toLowerCase();
  if (raw === "operation" || raw === "operacao" || raw === "prod") return "operation";
  return "demo";
}

export function isPostgresDatabaseUrl(url?: string | null): boolean {
  const u = (url ?? process.env.DATABASE_URL ?? "").trim().toLowerCase();
  return u.startsWith("postgres://") || u.startsWith("postgresql://");
}

export function isSqliteDatabaseUrl(url?: string | null): boolean {
  return (url ?? process.env.DATABASE_URL ?? "").trim().startsWith("file:");
}

/** Seed automático no build Netlify — padrão true em modo demo, false em operação. */
export function shouldSeedOnBuild(): boolean {
  if (getAppMode() === "operation") return false;

  const flag = process.env.RUN_SEED_ON_BUILD?.trim().toLowerCase();
  if (flag === "false" || flag === "0" || flag === "no") return false;
  if (flag === "true" || flag === "1" || flag === "yes") return true;

  return true;
}

/** Botão e API de restaurar demo — desligado em operação. */
export function isDemoResetAllowed(): boolean {
  if (getAppMode() === "operation") return false;

  const flag = process.env.ALLOW_DEMO_RESET?.trim().toLowerCase();
  if (flag === "true" || flag === "1") return true;
  if (flag === "false" || flag === "0") return false;
  if (process.env.NETLIFY === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export function isLambdaSqliteRuntime(): boolean {
  return Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) && isSqliteDatabaseUrl();
}

export function databaseEnvSummary(): {
  appMode: AppMode;
  provider: "sqlite" | "postgres" | "unknown";
  seedOnBuild: boolean;
  demoReset: boolean;
  lambdaSqlite: boolean;
} {
  return {
    appMode: getAppMode(),
    provider: isPostgresDatabaseUrl()
      ? "postgres"
      : isSqliteDatabaseUrl()
        ? "sqlite"
        : "unknown",
    seedOnBuild: shouldSeedOnBuild(),
    demoReset: isDemoResetAllowed(),
    lambdaSqlite: isLambdaSqliteRuntime(),
  };
}
