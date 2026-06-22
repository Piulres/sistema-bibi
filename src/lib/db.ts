import { copyFileSync, existsSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { isLambdaSqliteRuntime, isSqliteDatabaseUrl } from "@/lib/database-env";

function resolveSqlitePath(configured: string): string {
  if (!configured.startsWith("file:")) {
    return configured;
  }

  const pathPart = configured.slice("file:".length);
  if (!pathPart.startsWith("./")) {
    return configured;
  }

  const relative = pathPart.slice(2);
  // Prisma resolve file:./ relativo ao schema (prisma/) — normalizamos para prisma/*.db
  if (relative.startsWith("prisma/")) {
    return `file:${join(process.cwd(), relative)}`;
  }
  return `file:${join(process.cwd(), "prisma", relative)}`;
}

function resolveDatabaseUrl(): string | undefined {
  const configured = process.env.DATABASE_URL;
  if (!configured) return configured;

  // Postgres (operação): URL direta — banco compartilhado, sem cópia /tmp.
  if (!isSqliteDatabaseUrl(configured)) {
    return configured;
  }

  // SQLite local ou build: path absoluto.
  if (!isLambdaSqliteRuntime()) {
    return resolveSqlitePath(configured);
  }

  // SQLite em Lambda (modo demo): cópia efêmera para /tmp.
  const tmpDb = "/tmp/bibi-dev.db";
  if (!existsSync(tmpDb)) {
    const source = join(process.cwd(), "prisma", "dev.db");
    copyFileSync(source, tmpDb);
  }

  return `file:${tmpDb}`;
}

const databaseUrl = resolveDatabaseUrl();
if (databaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
