"use client";

import { useRef, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import DownloadLink from "@/components/DownloadLink";
import Alert from "@/components/ui/Alert";
import { useLabels } from "@/hooks/useLabels";

type ImportSummary = {
  message: string;
  total: number;
  created: number;
  skipped: number;
  errors: number;
  dryRun: boolean;
  rows: Array<{ row: number; status: string; message: string; identifier?: string }>;
};

type Props = {
  onImported: () => void;
};

export default function PjBeneficiaryImportPanel({ onImported }: Props) {
  const { labels } = useLabels();
  const fileRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [open, setOpen] = useState(false);

  async function loadFile(file: File) {
    const text = await file.text();
    setContent(text);
    setSummary(null);
    setError(null);
  }

  async function runImport(dryRun: boolean) {
    if (!content.trim()) {
      setError("Selecione um arquivo CSV antes de importar.");
      return;
    }
    setBusy(dryRun ? "dry-run" : "import");
    setError(null);
    setSummary(null);
    try {
      const res = await fetch("/api/pj/beneficiaries/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, format: "csv", dryRun }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro na importação");
        return;
      }
      setSummary(data);
      if (!dryRun && data.created > 0) {
        onImported();
      }
    } finally {
      setBusy(null);
    }
  }

  if (!open) {
    return (
      <div className="mb-4">
        <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
          Importar planilha CSV
        </Button>
      </div>
    );
  }

  return (
    <Card className="mb-4" padding="md">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Importar {labels.beneficiaries.toLowerCase()} em lote
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            CSV com nome, CPF e data de nascimento — vinculados automaticamente à sua empresa.
          </p>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Fechar
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <DownloadLink href="/api/pj/beneficiaries/import?format=csv" className="text-sm">
          Baixar modelo CSV
        </DownloadLink>
      </div>

      <div className="mt-3">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="block w-full text-sm text-[var(--text-secondary)] file:mr-3 file:rounded-[var(--radius-button)] file:border-0 file:bg-[var(--surface-muted)] file:px-3 file:py-2 file:text-sm file:font-medium"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void loadFile(file);
          }}
        />
      </div>

      {error && (
        <Alert tone="danger" className="mt-3">
          {error}
        </Alert>
      )}

      {summary && (
        <Alert tone={summary.errors > 0 ? "warning" : "success"} className="mt-3">
          <p className="font-medium">{summary.message}</p>
          <p className="mt-1 text-xs">
            Total {summary.total} · {summary.dryRun ? "Válidos" : "Criados"} {summary.created} ·
            Ignorados {summary.skipped} · Erros {summary.errors}
          </p>
        </Alert>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!content.trim() || busy !== null}
          onClick={() => void runImport(true)}
        >
          {busy === "dry-run" ? "Validando…" : "Validar"}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!content.trim() || busy !== null}
          onClick={() => void runImport(false)}
        >
          {busy === "import" ? "Importando…" : "Importar"}
        </Button>
      </div>
    </Card>
  );
}
