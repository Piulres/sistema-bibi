"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import type { ExportFormat } from "@/lib/exports/format";
import { LIST_EXPORT_FORMATS } from "@/lib/exports/format";
import { buildExportUrl, downloadExportFile } from "@/lib/ui/download-export";

const FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf: "PDF",
  xlsx: "Excel",
  csv: "CSV",
  json: "JSON",
  txt: "TXT",
};

type Props = {
  baseUrl: string;
  query?: Record<string, string | undefined>;
  formats?: ExportFormat[];
  size?: "sm" | "md";
  variant?: "portal" | "secondary" | "ghost";
  onError?: (message: string) => void;
};

export default function ExportButtons({
  baseUrl,
  query = {},
  formats = LIST_EXPORT_FORMATS,
  size = "sm",
  variant = "secondary",
  onError,
}: Props) {
  const [busyFormat, setBusyFormat] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload(format: ExportFormat) {
    const url = buildExportUrl(baseUrl, query, format);
    setBusyFormat(format);
    setError(null);
    try {
      const result = await downloadExportFile(url, `export.${format}`);
      if (!result.ok) {
        const message = result.error;
        setError(message);
        onError?.(message);
      }
    } catch {
      const message = "Falha inesperada ao exportar.";
      setError(message);
      onError?.(message);
    } finally {
      setBusyFormat(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
      {formats.map((format) => (
        <Button
          key={format}
          variant={variant}
          size={size}
          type="button"
          disabled={busyFormat !== null}
          onClick={() => void handleDownload(format)}
        >
          {busyFormat === format ? "..." : FORMAT_LABELS[format]}
        </Button>
      ))}
      </div>
      {error && (
        <Alert tone="danger" className="text-xs">
          {error}
        </Alert>
      )}
    </div>
  );
}
