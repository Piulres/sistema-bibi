"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import type { ExportFormat } from "@/lib/exports/format";
import { LIST_EXPORT_FORMATS } from "@/lib/exports/format";
import {
  buildExportUrl,
  downloadExportFile,
  printExportFile,
} from "@/lib/ui/download-export";

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
  /** Contexto para leitores de tela — ex.: "Encaminhamento Cardiologia". */
  ariaLabel?: string;
  /** Botão Imprimir (PDF) — fluxo típico da recepção. */
  showPrint?: boolean;
};

export default function ExportButtons({
  baseUrl,
  query = {},
  formats = LIST_EXPORT_FORMATS,
  size = "sm",
  variant = "secondary",
  onError,
  ariaLabel,
  showPrint = false,
}: Props) {
  const [busyFormat, setBusyFormat] = useState<ExportFormat | "print" | null>(null);
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

  async function handlePrint() {
    const url = buildExportUrl(baseUrl, query, "pdf");
    setBusyFormat("print");
    setError(null);
    try {
      const result = await printExportFile(url);
      if (!result.ok) {
        setError(result.error);
        onError?.(result.error);
      }
    } catch {
      const message = "Falha inesperada ao imprimir.";
      setError(message);
      onError?.(message);
    } finally {
      setBusyFormat(null);
    }
  }

  const busy = busyFormat !== null;
  const context = ariaLabel?.trim();

  return (
    <div className="space-y-2" aria-busy={busy || undefined}>
      <div className="flex flex-wrap gap-2">
        {showPrint && (
          <Button
            variant={variant}
            size={size}
            type="button"
            disabled={busy}
            aria-label={context ? `Imprimir ${context}` : "Imprimir PDF"}
            onClick={() => void handlePrint()}
          >
            {busyFormat === "print" ? "..." : "Imprimir"}
          </Button>
        )}
        {formats.map((format) => (
          <Button
            key={format}
            variant={variant}
            size={size}
            type="button"
            disabled={busy}
            aria-label={
              context
                ? `Baixar ${FORMAT_LABELS[format]} — ${context}`
                : `Baixar ${FORMAT_LABELS[format]}`
            }
            onClick={() => void handleDownload(format)}
          >
            {busyFormat === format ? "..." : FORMAT_LABELS[format]}
          </Button>
        ))}
      </div>
      {error && (
        <Alert tone="danger" className="text-xs" role="alert">
          {error}
        </Alert>
      )}
    </div>
  );
}
