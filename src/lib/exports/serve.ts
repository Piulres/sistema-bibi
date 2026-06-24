import "server-only";
import { NextResponse } from "next/server";
import {
  buildInterchangeDataset,
  serializeInterchangeDataset,
} from "@/lib/imports/interchange";
import {
  exportFileExtension,
  exportMimeType,
  type ExportFormat,
} from "@/lib/exports/format";
import {
  buildTablePdfBufferFromTabular,
  buildXlsxBufferFromTabular,
  type TabularExport,
} from "@/lib/exports/tabular";

export type ExportBranding = {
  clinicName: string;
  platformLabel?: string;
};

function attachmentHeaders(format: ExportFormat, filename: string): HeadersInit {
  return {
    "Content-Type": exportMimeType(format),
    "Content-Disposition": `attachment; filename="${filename}"`,
  };
}

export function exportFilename(base: string, format: ExportFormat): string {
  return `${base}.${exportFileExtension(format)}`;
}

/** Resposta de download para buffer binário (PDF/XLSX). */
export function serveBufferExport(
  format: ExportFormat,
  filenameBase: string,
  buffer: Buffer,
): NextResponse {
  const filename = exportFilename(filenameBase, format);
  return new NextResponse(new Uint8Array(buffer), {
    headers: attachmentHeaders(format, filename),
  });
}

/** Converte TabularExport para CSV, XLSX, PDF tabular ou JSON estruturado. */
export async function serveTabularExport(
  format: ExportFormat,
  filenameBase: string,
  data: TabularExport,
  branding?: ExportBranding,
): Promise<NextResponse> {
  const filename = exportFilename(filenameBase, format);

  if (format === "json") {
    const dataset = buildInterchangeDataset({
      entity: "export",
      columns: data.columns.map((column) => ({ key: column.key, header: column.header })),
      rows: data.rows,
    });
    const payload = {
      title: data.title,
      subtitle: data.subtitle ?? null,
      ...dataset,
    };
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: attachmentHeaders("json", filename),
    });
  }

  if (format === "csv") {
    const dataset = buildInterchangeDataset({
      entity: "export",
      columns: data.columns.map((column) => ({ key: column.key, header: column.header })),
      rows: data.rows,
    });
    return new NextResponse(serializeInterchangeDataset(dataset, "csv"), {
      headers: attachmentHeaders("csv", filename),
    });
  }

  if (format === "xlsx") {
    const buffer = await buildXlsxBufferFromTabular(data);
    return serveBufferExport("xlsx", filenameBase, buffer);
  }

  const buffer = await buildTablePdfBufferFromTabular(data, branding);
  return serveBufferExport("pdf", filenameBase, buffer);
}
