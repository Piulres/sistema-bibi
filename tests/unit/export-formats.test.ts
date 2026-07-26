import { describe, expect, it } from "vitest";
import {
  EXPORT_FORMATS,
  LIST_EXPORT_FORMATS,
  REPORT_EXPORT_FORMATS,
  exportMimeType,
  isExportFormat,
  parseExportFormat,
} from "@/lib/exports/format";
import { buildTxtFromTabular } from "@/lib/exports/text";
import {
  buildInterchangeDataset,
  parseInterchangeContent,
  serializeInterchangeDataset,
  stripUtf8Bom,
} from "@/lib/imports/interchange";

describe("export formats", () => {
  it("reconhece pdf, xlsx, csv, json e txt", () => {
    expect(EXPORT_FORMATS).toEqual(["pdf", "xlsx", "csv", "json", "txt"]);
    for (const format of EXPORT_FORMATS) {
      expect(isExportFormat(format)).toBe(true);
      expect(parseExportFormat(format)).toBe(format);
    }
    expect(parseExportFormat("TXT")).toBe("txt");
    expect(parseExportFormat("unknown", "pdf")).toBe("pdf");
  });

  it("mantém conjuntos de UI para relatórios e listagens", () => {
    expect(REPORT_EXPORT_FORMATS).toEqual(["pdf", "csv", "json", "txt"]);
    expect(LIST_EXPORT_FORMATS).toContain("csv");
    expect(LIST_EXPORT_FORMATS).toContain("json");
  });

  it("mimes corretos por formato", () => {
    expect(exportMimeType("csv")).toContain("text/csv");
    expect(exportMimeType("json")).toContain("application/json");
    expect(exportMimeType("txt")).toBe("text/plain; charset=utf-8");
    expect(exportMimeType("pdf")).toBe("application/pdf");
  });
});

describe("tabular txt/csv", () => {
  const sample = {
    title: "Relatório teste",
    subtitle: "Período demo",
    columns: [
      { header: "Nome", key: "name" },
      { header: "Valor", key: "amount" },
    ],
    rows: [{ name: "Maria, Silva", amount: "R$ 10,00" }],
  };

  it("gera TXT legível com título e linhas", () => {
    const txt = buildTxtFromTabular(sample);
    expect(txt).toContain("Relatório teste");
    expect(txt).toContain("Período demo");
    expect(txt).toContain("Nome | Valor");
    expect(txt).toContain("Maria, Silva | R$ 10,00");
  });

  it("CSV inclui BOM e escapa cabeçalhos/células", () => {
    const dataset = buildInterchangeDataset({
      entity: "export",
      columns: sample.columns.map((column) => ({ key: column.key, header: column.header })),
      rows: sample.rows,
    });
    const csv = serializeInterchangeDataset(dataset, "csv");
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(stripUtf8Bom(csv)).toContain('"Maria, Silva"');

    const parsed = parseInterchangeContent(csv, "csv", "export", sample.columns);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.dataset.rows[0].name).toBe("Maria, Silva");
    }
  });
});
