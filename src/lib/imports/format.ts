/** Formatos de interchange para importação e exportação tabular (JSON ↔ CSV). */
export const INTERCHANGE_FORMATS = ["json", "csv"] as const;

export type InterchangeFormat = (typeof INTERCHANGE_FORMATS)[number];

const FORMAT_SET = new Set<string>(INTERCHANGE_FORMATS);

export function isInterchangeFormat(value: string): value is InterchangeFormat {
  return FORMAT_SET.has(value);
}

export function parseInterchangeFormat(
  raw: string | null | undefined,
  fallback: InterchangeFormat = "json",
): InterchangeFormat {
  const normalized = raw?.trim().toLowerCase();
  if (normalized && isInterchangeFormat(normalized)) return normalized;
  return fallback;
}

export function interchangeMimeType(format: InterchangeFormat): string {
  return format === "csv" ? "text/csv; charset=utf-8" : "application/json; charset=utf-8";
}

export function interchangeFileExtension(format: InterchangeFormat): string {
  return format;
}
