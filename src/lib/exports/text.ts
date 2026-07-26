import type { TabularExport } from "@/lib/exports/tabular-types";

function cellValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return String(value);
}

/** Relatório texto legível (título + tabela com separador `|`). */
export function buildTxtFromTabular(data: TabularExport): string {
  const lines: string[] = [data.title];
  if (data.subtitle) lines.push(data.subtitle);
  lines.push("");
  lines.push(data.columns.map((column) => column.header).join(" | "));
  lines.push(data.columns.map((column) => "-".repeat(Math.max(column.header.length, 3))).join("-+-"));
  for (const row of data.rows) {
    lines.push(data.columns.map((column) => cellValue(row[column.key])).join(" | "));
  }
  lines.push("");
  lines.push(`Gerado em ${new Date().toLocaleString("pt-BR")}`);
  return `${lines.join("\n")}\n`;
}
