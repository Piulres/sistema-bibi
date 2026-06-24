import type { InterchangeFormat } from "@/lib/imports/format";

export const INTERCHANGE_VERSION = 1;

export type InterchangeColumn = {
  key: string;
  header: string;
};

export type InterchangeDataset = {
  entity: string;
  version: number;
  exportedAt: string;
  columns: InterchangeColumn[];
  rows: Record<string, string>[];
};

export type ParseInterchangeResult =
  | { ok: true; dataset: InterchangeDataset }
  | { ok: false; error: string };

function cellValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return String(value);
}

/** Escapa e monta uma linha CSV a partir de valores ordenados por coluna. */
export function serializeCsvRow(values: string[]): string {
  return values
    .map((str) => {
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
    .join(",");
}

/** Parser CSV simples com suporte a campos entre aspas. */
export function parseCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };

  const pushRow = () => {
    if (row.length > 0 || field.length > 0) {
      pushField();
      rows.push(row);
      row = [];
    }
  };

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      pushField();
      continue;
    }

    if (char === "\n") {
      pushRow();
      continue;
    }

    if (char === "\r") {
      if (next === "\n") i += 1;
      pushRow();
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    pushField();
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim().length > 0));
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase();
}

function resolveColumnKey(
  header: string,
  columns: InterchangeColumn[],
): string | null {
  const normalized = normalizeHeader(header);
  const byKey = columns.find((column) => normalizeHeader(column.key) === normalized);
  if (byKey) return byKey.key;
  const byHeader = columns.find((column) => normalizeHeader(column.header) === normalized);
  return byHeader?.key ?? null;
}

export function buildInterchangeDataset(input: {
  entity: string;
  columns: InterchangeColumn[];
  rows: Record<string, string | number | boolean | null | undefined>[];
  exportedAt?: string;
}): InterchangeDataset {
  return {
    entity: input.entity,
    version: INTERCHANGE_VERSION,
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    columns: input.columns,
    rows: input.rows.map((row) => {
      const record: Record<string, string> = {};
      for (const column of input.columns) {
        record[column.key] = cellValue(row[column.key]);
      }
      return record;
    }),
  };
}

export function serializeInterchangeDataset(
  dataset: InterchangeDataset,
  format: InterchangeFormat,
): string {
  if (format === "json") {
    return JSON.stringify(dataset, null, 2);
  }

  const header = dataset.columns.map((column) => column.header).join(",");
  const lines = dataset.rows.map((row) =>
    serializeCsvRow(dataset.columns.map((column) => row[column.key] ?? "")),
  );
  return [header, ...lines].join("\n");
}

export function parseInterchangeContent(
  content: string,
  format: InterchangeFormat,
  expectedEntity: string,
  columns: InterchangeColumn[],
): ParseInterchangeResult {
  const trimmed = content.trim();
  if (!trimmed) {
    return { ok: false, error: "Arquivo vazio" };
  }

  if (format === "json") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return { ok: false, error: "JSON inválido" };
    }

    if (!parsed || typeof parsed !== "object") {
      return { ok: false, error: "JSON deve ser um objeto" };
    }

    const payload = parsed as Record<string, unknown>;
    const entity = typeof payload.entity === "string" ? payload.entity : expectedEntity;
    if (entity !== expectedEntity) {
      return { ok: false, error: `Entidade esperada: ${expectedEntity}, recebida: ${entity}` };
    }

    const exportedAt =
      typeof payload.exportedAt === "string" ? payload.exportedAt : new Date().toISOString();

    let rowObjects: Record<string, unknown>[] = [];
    if (Array.isArray(payload.rows)) {
      rowObjects = payload.rows.filter(
        (row): row is Record<string, unknown> => !!row && typeof row === "object" && !Array.isArray(row),
      );
    } else if (Array.isArray(payload)) {
      rowObjects = payload.filter(
        (row): row is Record<string, unknown> => !!row && typeof row === "object" && !Array.isArray(row),
      );
    } else {
      return { ok: false, error: "JSON deve conter array 'rows'" };
    }

    const rows = rowObjects.map((row) => {
      const record: Record<string, string> = {};
      for (const column of columns) {
        const direct = row[column.key];
        const alias = row[column.header];
        const value = direct ?? alias;
        record[column.key] = cellValue(value as string | number | boolean | null | undefined);
      }
      return record;
    });

    return {
      ok: true,
      dataset: {
        entity,
        version: INTERCHANGE_VERSION,
        exportedAt,
        columns,
        rows,
      },
    };
  }

  const matrix = parseCsvRows(trimmed);
  if (matrix.length === 0) {
    return { ok: false, error: "CSV sem linhas" };
  }

  const [headerRow, ...dataRows] = matrix;
  const keys = headerRow.map((header) => resolveColumnKey(header, columns));
  if (keys.some((key) => !key)) {
    const unknown = headerRow.filter((header, index) => !keys[index]);
    return {
      ok: false,
      error: `Colunas CSV não reconhecidas: ${unknown.join(", ")}`,
    };
  }

  const rows = dataRows.map((cells) => {
    const record: Record<string, string> = {};
    keys.forEach((key, index) => {
      if (key) record[key] = (cells[index] ?? "").trim();
    });
    return record;
  });

  return {
    ok: true,
    dataset: {
      entity: expectedEntity,
      version: INTERCHANGE_VERSION,
      exportedAt: new Date().toISOString(),
      columns,
      rows,
    },
  };
}

/** Converte conteúdo entre JSON e CSV preservando o dataset canônico. */
export function convertInterchangeContent(input: {
  content: string;
  from: InterchangeFormat;
  to: InterchangeFormat;
  entity: string;
  columns: InterchangeColumn[];
}): ParseInterchangeResult & { content?: string } {
  const parsed = parseInterchangeContent(input.content, input.from, input.entity, input.columns);
  if (!parsed.ok) return parsed;
  if (input.from === input.to) {
    return { ok: true, dataset: parsed.dataset, content: input.content };
  }
  return {
    ok: true,
    dataset: parsed.dataset,
    content: serializeInterchangeDataset(parsed.dataset, input.to),
  };
}
