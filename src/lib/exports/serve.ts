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
import { buildTxtFromTabular } from "@/lib/exports/text";

export type ExportBranding = {
  clinicName: string;
  platformLabel?: string;
};

/** Nome seguro para Content-Disposition / atributo download (sem path separators). */
export function sanitizeAttachmentFilename(filename: string): string {
  return filename
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function attachmentHeaders(format: ExportFormat, filename: string): HeadersInit {
  const safe = sanitizeAttachmentFilename(filename);
  const asciiFallback = safe.replace(/[^\x20-\x7E]+/g, "_").replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(safe);
  return {
    "Content-Type": exportMimeType(format),
    "Content-Disposition": `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`,
  };
}

export function exportFilename(base: string, format: ExportFormat): string {
  const safeBase = sanitizeAttachmentFilename(base);
  return `${safeBase}.${exportFileExtension(format)}`;
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

/** Converte TabularExport para CSV, XLSX, PDF tabular, JSON ou TXT. */
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

  if (format === "txt") {
    return new NextResponse(buildTxtFromTabular(data), {
      headers: attachmentHeaders("txt", filename),
    });
  }

  if (format === "xlsx") {
    const buffer = await buildXlsxBufferFromTabular(data);
    return serveBufferExport("xlsx", filenameBase, buffer);
  }

  const buffer = await buildTablePdfBufferFromTabular(data, branding);
  return serveBufferExport("pdf", filenameBase, buffer);
}
