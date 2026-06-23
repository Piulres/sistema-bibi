import "server-only";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { PLATFORM } from "@/lib/platform";

export type TabularColumn = {
  header: string;
  key: string;
  width?: number;
};

export type TabularExport = {
  title: string;
  subtitle?: string;
  sheetName?: string;
  columns: TabularColumn[];
  rows: Record<string, string | number | boolean | null | undefined>[];
};

function cellValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return String(value);
}

export function buildCsvFromTabular(data: TabularExport): string {
  const header = data.columns.map((c) => c.header).join(",");
  const lines = data.rows.map((row) =>
    data.columns
      .map((col) => {
        const str = cellValue(row[col.key]);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(","),
  );
  return [header, ...lines].join("\n");
}

export async function buildXlsxBufferFromTabular(data: TabularExport): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = PLATFORM.name;
  const sheet = workbook.addWorksheet(data.sheetName ?? data.title.slice(0, 31));

  sheet.addRow([data.title]);
  if (data.subtitle) sheet.addRow([data.subtitle]);
  sheet.addRow([]);

  sheet.addRow(data.columns.map((c) => c.header));
  const headerRow = sheet.lastRow;
  if (headerRow) {
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2E8F0" },
    };
  }

  for (const row of data.rows) {
    sheet.addRow(data.columns.map((col) => cellValue(row[col.key])));
  }

  data.columns.forEach((col, index) => {
    sheet.getColumn(index + 1).width = col.width ?? Math.max(col.header.length + 2, 14);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function pdfBufferFromDoc(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

/** PDF tabular simples (relatórios, listagens). */
export async function buildTablePdfBufferFromTabular(
  data: TabularExport,
  branding?: { clinicName: string; platformLabel?: string },
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 48, size: "A4" });
  const clinic = branding?.clinicName ?? "Clínica";
  const platform = branding?.platformLabel ?? PLATFORM.name;

  doc.fontSize(16).fillColor("#0f172a").text(clinic, { align: "left" });
  doc.moveDown(0.3);
  doc.fontSize(12).fillColor("#334155").text(data.title);
  if (data.subtitle) {
    doc.fontSize(10).fillColor("#64748b").text(data.subtitle);
  }
  doc.moveDown(0.8);

  const colWidths = data.columns.map((c) => c.width ?? 90);
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const startX = doc.page.margins.left;
  let y = doc.y;

  const drawRow = (cells: string[], bold = false) => {
    if (y > doc.page.height - doc.page.margins.bottom - 40) {
      doc.addPage();
      y = doc.page.margins.top;
    }
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9).fillColor("#0f172a");
    let x = startX;
    cells.forEach((cell, i) => {
      doc.text(cell, x, y, { width: colWidths[i] - 4, lineBreak: false, ellipsis: true });
      x += colWidths[i];
    });
    y += 16;
  };

  drawRow(data.columns.map((c) => c.header), true);
  for (const row of data.rows) {
    drawRow(data.columns.map((col) => cellValue(row[col.key])));
  }

  doc.moveDown(2);
  doc.fontSize(8).fillColor("#94a3b8").text(
    `Gerado em ${new Date().toLocaleString("pt-BR")} · ${platform}`,
    startX,
    doc.page.height - doc.page.margins.bottom - 20,
    { width: tableWidth, align: "center" },
  );

  return pdfBufferFromDoc(doc);
}
