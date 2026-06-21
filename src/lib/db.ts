import { copyFileSync, existsSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";

function resolveDatabaseUrl(): string | undefined {
  const configured = process.env.DATABASE_URL;
  if (!configured?.startsWith("file:")) {
    return configured;
  }

  const isServerless =
    process.env.NETlify === "true" || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (!isServerless) {
    return configured;
  }

  // Copia o SQLite seedado para /tmp (unico diretorio gravavel em serverless).
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
