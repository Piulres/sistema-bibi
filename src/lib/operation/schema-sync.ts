// Sem `import "server-only"`: o seed (tsx) carrega este módulo via
// db.ts → sqlite-blob-persistence — mesmo padrão dos demais módulos do dual-store.
import { PrismaClient } from "@prisma/client";

/**
 * Sincronização de schema do banco de OPERAÇÃO (dual-store).
 *
 * Contexto: o `operation.db` persistido em Netlify Blobs sempre vence o
 * artefato de build (`syncOperationDatabaseFromBlob`), então o banco de
 * produção fica congelado no schema da época do primeiro persist — tabelas
 * e colunas adicionadas depois nunca chegam lá (`prisma db push` não roda na
 * Lambda). Incidente real: `ClinicExamLaunch` sem as colunas da ponte v2.6
 * (`bridgeStatus`, `appointmentId`…) → 500 em /interno/gestao (não salva).
 *
 * Este módulo compara o banco ativo com o artefato de build (schema atual,
 * gerado no `db:setup`) e aplica migrações aditivas idempotentes:
 *  - `CREATE TABLE` para tabelas ausentes (DDL da referência);
 *  - `ALTER TABLE … ADD COLUMN` para colunas ausentes (nullable/with default);
 *  - `CREATE INDEX IF NOT EXISTS` para índices ausentes.
 *
 * Mudanças destrutivas (drop/rename/NOT NULL sem default) ficam fora — são
 * registradas em log e exigem migração assistida.
 */

type TableDef = { name: string; sql: string };
type IndexDef = { name: string; sql: string };

export type SchemaSyncResult = {
  createdTables: string[];
  addedColumns: string[];
  createdIndexes: string[];
  skipped: string[];
};

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

async function readTables(prisma: PrismaClient): Promise<TableDef[]> {
  const rows = await prisma.$queryRawUnsafe<{ name: string; sql: string | null }[]>(
    "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'",
  );
  return rows.filter((r): r is TableDef => Boolean(r.sql)).map((r) => ({ name: r.name, sql: r.sql }));
}

async function readIndexes(prisma: PrismaClient): Promise<IndexDef[]> {
  const rows = await prisma.$queryRawUnsafe<{ name: string; sql: string | null }[]>(
    "SELECT name, sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL",
  );
  return rows.filter((r): r is IndexDef => Boolean(r.sql)).map((r) => ({ name: r.name, sql: r.sql }));
}

async function readColumns(prisma: PrismaClient, table: string): Promise<string[]> {
  const rows = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `PRAGMA table_info(${quoteIdent(table)})`,
  );
  return rows.map((r) => r.name);
}

/**
 * Extrai a definição de uma coluna do DDL `CREATE TABLE` da referência.
 * As DDLs geradas pelo Prisma têm uma coluna por linha (`"nome" TIPO …,`).
 */
export function extractColumnDefinition(createTableSql: string, column: string): string | null {
  const lines = createTableSql.split("\n").map((l) => l.trim().replace(/,\s*$/, ""));
  const prefix = `"${column}"`;
  const line = lines.find((l) => l.startsWith(`${prefix} `) || l === prefix);
  if (!line || line.startsWith("CONSTRAINT")) return null;
  // Analisa só a definição (após o nome) — o nome da coluna pode conter
  // palavras-chave (ex.: "hasDefault").
  const definition = line.slice(prefix.length);
  // ADD COLUMN não aceita PRIMARY KEY/UNIQUE; NOT NULL exige DEFAULT.
  if (/PRIMARY KEY|UNIQUE/i.test(definition)) return null;
  if (/NOT NULL/i.test(definition) && !/DEFAULT/i.test(definition)) return null;
  return line;
}

/**
 * Aplica no banco `active` as adições de schema presentes em `reference`.
 * Ambos são caminhos absolutos de arquivos SQLite. Idempotente.
 */
export async function syncSqliteSchema(
  activePath: string,
  referencePath: string,
): Promise<SchemaSyncResult> {
  const result: SchemaSyncResult = {
    createdTables: [],
    addedColumns: [],
    createdIndexes: [],
    skipped: [],
  };

  const reference = new PrismaClient({
    datasources: { db: { url: `file:${referencePath}` } },
  });
  const active = new PrismaClient({
    datasources: { db: { url: `file:${activePath}` } },
  });

  try {
    const [refTables, activeTables] = await Promise.all([
      readTables(reference),
      readTables(active),
    ]);
    const activeTableNames = new Set(activeTables.map((t) => t.name));

    for (const table of refTables) {
      if (!activeTableNames.has(table.name)) {
        await active.$executeRawUnsafe(
          table.sql.replace(/^CREATE TABLE/i, "CREATE TABLE IF NOT EXISTS"),
        );
        result.createdTables.push(table.name);
        continue;
      }

      const [refCols, activeCols] = await Promise.all([
        readColumns(reference, table.name),
        readColumns(active, table.name),
      ]);
      const activeColSet = new Set(activeCols);
      for (const col of refCols) {
        if (activeColSet.has(col)) continue;
        const definition = extractColumnDefinition(table.sql, col);
        if (!definition) {
          result.skipped.push(`${table.name}.${col}`);
          continue;
        }
        await active.$executeRawUnsafe(
          `ALTER TABLE ${quoteIdent(table.name)} ADD COLUMN ${definition}`,
        );
        result.addedColumns.push(`${table.name}.${col}`);
      }
    }

    const [refIndexes, activeIndexes] = await Promise.all([
      readIndexes(reference),
      readIndexes(active),
    ]);
    const activeIndexNames = new Set(activeIndexes.map((i) => i.name));
    for (const index of refIndexes) {
      if (activeIndexNames.has(index.name)) continue;
      const ddl = index.sql.replace(/^CREATE( UNIQUE)? INDEX/i, (m) =>
        m.toUpperCase().includes("UNIQUE")
          ? "CREATE UNIQUE INDEX IF NOT EXISTS"
          : "CREATE INDEX IF NOT EXISTS",
      );
      try {
        await active.$executeRawUnsafe(ddl);
        result.createdIndexes.push(index.name);
      } catch {
        // Índice UNIQUE pode falhar se dados legados violarem — não bloquear o boot.
        result.skipped.push(`index:${index.name}`);
      }
    }

    return result;
  } finally {
    await Promise.all([reference.$disconnect(), active.$disconnect()]);
  }
}
