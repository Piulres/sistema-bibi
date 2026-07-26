export const EXPORT_FORMATS = ["pdf", "xlsx", "csv", "json", "txt"] as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[number];

/** Formatos prioritários de relatórios (UI de /relatorios). */
export const REPORT_EXPORT_FORMATS: ExportFormat[] = ["pdf", "csv", "json", "txt"];

/** Formatos para listagens tabulares (faturamento, auditoria, extrato, etc.). */
export const LIST_EXPORT_FORMATS: ExportFormat[] = ["pdf", "xlsx", "csv", "json"];

const FORMAT_SET = new Set<string>(EXPORT_FORMATS);

export function isExportFormat(value: string): value is ExportFormat {
  return FORMAT_SET.has(value);
}

export function parseExportFormat(
  raw: string | null | undefined,
  fallback: ExportFormat = "xlsx",
): ExportFormat {
  const normalized = raw?.trim().toLowerCase();
  if (normalized && isExportFormat(normalized)) return normalized;
  return fallback;
}

export function exportMimeType(format: ExportFormat): string {
  switch (format) {
    case "pdf":
      return "application/pdf";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "csv":
      return "text/csv; charset=utf-8";
    case "json":
      return "application/json; charset=utf-8";
    case "txt":
      return "text/plain; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

export function exportFileExtension(format: ExportFormat): string {
  return format === "xlsx" ? "xlsx" : format;
}
