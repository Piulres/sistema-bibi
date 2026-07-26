import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import {
  extractColumnDefinition,
  syncSqliteSchema,
} from "@/lib/operation/schema-sync";

const dir = mkdtempSync(join(tmpdir(), "schema-sync-"));
const referencePath = join(dir, "reference.db");
const activePath = join(dir, "active.db");

async function runSql(path: string, statements: string[]): Promise<void> {
  const prisma = new PrismaClient({ datasources: { db: { url: `file:${path}` } } });
  try {
    for (const sql of statements) {
      await prisma.$executeRawUnsafe(sql);
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function queryRows<T>(path: string, sql: string): Promise<T[]> {
  const prisma = new PrismaClient({ datasources: { db: { url: `file:${path}` } } });
  try {
    return await prisma.$queryRawUnsafe<T[]>(sql);
  } finally {
    await prisma.$disconnect();
  }
}

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("operation schema-sync", () => {
  it("adiciona colunas, tabelas e índices ausentes (caso ClinicExamLaunch v2.5 → atual)", async () => {
    // Referência = schema atual (com colunas da ponte + tabela nova + índice)
    await runSql(referencePath, [
      `CREATE TABLE "ClinicExamLaunch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientName" TEXT NOT NULL,
    "amountReceived" REAL NOT NULL,
    "bridgeStatus" TEXT,
    "bridgeNote" TEXT,
    "appointmentId" TEXT,
    "usageId" TEXT,
    "invoiceId" TEXT,
    CONSTRAINT "ClinicExamLaunch_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
)`,
      `CREATE TABLE "NovaTabela" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL
)`,
      `CREATE INDEX "ClinicExamLaunch_bridgeStatus_idx" ON "ClinicExamLaunch"("bridgeStatus")`,
    ]);

    // Ativo = schema antigo (era v2.5, sem colunas da ponte) + dado legado
    await runSql(activePath, [
      `CREATE TABLE "ClinicExamLaunch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientName" TEXT NOT NULL,
    "amountReceived" REAL NOT NULL
)`,
      `INSERT INTO "ClinicExamLaunch" ("id", "patientName", "amountReceived") VALUES ('legado-1', 'Paciente Legado', 350)`,
    ]);

    const result = await syncSqliteSchema(activePath, referencePath);

    expect(result.addedColumns.sort()).toEqual([
      "ClinicExamLaunch.appointmentId",
      "ClinicExamLaunch.bridgeNote",
      "ClinicExamLaunch.bridgeStatus",
      "ClinicExamLaunch.invoiceId",
      "ClinicExamLaunch.usageId",
    ]);
    expect(result.createdTables).toEqual(["NovaTabela"]);
    expect(result.createdIndexes).toEqual(["ClinicExamLaunch_bridgeStatus_idx"]);
    expect(result.skipped).toEqual([]);

    // Dado legado preservado e coluna nova utilizável
    await runSql(activePath, [
      `UPDATE "ClinicExamLaunch" SET "bridgeStatus" = 'SYNCED' WHERE "id" = 'legado-1'`,
    ]);
    const rows = await queryRows<{ id: string; bridgeStatus: string | null }>(
      activePath,
      `SELECT "id", "bridgeStatus" FROM "ClinicExamLaunch"`,
    );
    expect(rows).toEqual([{ id: "legado-1", bridgeStatus: "SYNCED" }]);
  });

  it("é idempotente — segunda execução não altera nada", async () => {
    const again = await syncSqliteSchema(activePath, referencePath);
    expect(again.addedColumns).toEqual([]);
    expect(again.createdTables).toEqual([]);
    expect(again.createdIndexes).toEqual([]);
  });

  it("extractColumnDefinition ignora constraints e colunas não migráveis", () => {
    const ddl = `CREATE TABLE "T" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nullableCol" TEXT,
    "comDefault" INTEGER NOT NULL DEFAULT 0,
    "semDefault" TEXT NOT NULL,
    "unica" TEXT UNIQUE,
    CONSTRAINT "T_fkey" FOREIGN KEY ("id") REFERENCES "X" ("id")
)`;
    expect(extractColumnDefinition(ddl, "nullableCol")).toBe('"nullableCol" TEXT');
    expect(extractColumnDefinition(ddl, "comDefault")).toBe(
      '"comDefault" INTEGER NOT NULL DEFAULT 0',
    );
    expect(extractColumnDefinition(ddl, "id")).toBeNull(); // PRIMARY KEY
    expect(extractColumnDefinition(ddl, "semDefault")).toBeNull(); // NOT NULL sem default
    expect(extractColumnDefinition(ddl, "unica")).toBeNull(); // UNIQUE
    expect(extractColumnDefinition(ddl, "inexistente")).toBeNull();
  });
});
