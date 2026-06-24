"use client";

import { useCallback, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import SectionHeader from "@/components/ui/SectionHeader";
import type { ImportEntity } from "@/lib/imports/schemas";
import type { InterchangeFormat } from "@/lib/imports/format";

type ImportInterchangePanelProps = {
  entity: ImportEntity;
  entityLabel: string;
  onImported?: () => void | Promise<void>;
};

type ImportSummary = {
  message: string;
  total: number;
  created: number;
  skipped: number;
  errors: number;
  dryRun: boolean;
  rows: Array<{ row: number; status: string; message: string; identifier?: string }>;
};

const fieldClass =
  "mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 font-mono text-xs";

export default function ImportInterchangePanel({
  entity,
  entityLabel,
  onImported,
}: ImportInterchangePanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [format, setFormat] = useState<InterchangeFormat>("json");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const downloadUrl = useCallback(
    (mode: "template" | "export") =>
      `/api/interno/import/${entity}?mode=${mode}&format=${format}`,
    [entity, format],
  );

  async function loadFile(file: File) {
    const text = await file.text();
    setContent(text);
    setSummary(null);
    setError(null);
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".csv")) setFormat("csv");
    if (lower.endsWith(".json")) setFormat("json");
  }

  async function convertFormat(target: InterchangeFormat) {
    if (!content.trim()) {
      setError("Cole ou carregue um arquivo antes de converter.");
      return;
    }
    setBusy("convert");
    setError(null);
    try {
      const res = await fetch("/api/interno/import/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, from: format, to: target, entity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro na conversão");
        return;
      }
      setContent(data.content);
      setFormat(target);
      setSummary(null);
    } finally {
      setBusy(null);
    }
  }

  async function runImport(dryRun: boolean) {
    if (!content.trim()) {
      setError("Cole ou carregue um arquivo para importar.");
      return;
    }
    setBusy(dryRun ? "dry-run" : "import");
    setError(null);
    setSummary(null);
    try {
      const res = await fetch(`/api/interno/import/${entity}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, format, dryRun }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro na importação");
        return;
      }
      setSummary(data);
      if (!dryRun && data.created > 0) {
        await onImported?.();
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="lg:col-span-2">
      <SectionHeader
        title={`Importar ${entityLabel}`}
        description="JSON e CSV usam o mesmo formato canônico — alterne com um clique antes de importar."
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-[var(--text-secondary)]">Formato:</span>
        {(["json", "csv"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFormat(item)}
            className={`rounded-full px-3 py-1 text-sm font-medium uppercase transition ${
              format === item
                ? "bg-[var(--brand-primary)] text-white"
                : "bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--border-muted)]"
            }`}
          >
            {item}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap gap-2">
          <a href={downloadUrl("template")} className="inline-flex">
            <Button type="button" variant="secondary" size="sm">
              Baixar modelo
            </Button>
          </a>
          <a href={downloadUrl("export")} className="inline-flex">
            <Button type="button" variant="secondary" size="sm">
              Exportar atual ({format.toUpperCase()})
            </Button>
          </a>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy !== null || format === "json"}
          onClick={() => convertFormat("json")}
        >
          {busy === "convert" && format !== "json" ? "Convertendo..." : "→ JSON"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy !== null || format === "csv"}
          onClick={() => convertFormat("csv")}
        >
          {busy === "convert" && format !== "csv" ? "Convertendo..." : "→ CSV"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.csv,application/json,text/csv"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void loadFile(file);
            event.target.value = "";
          }}
        />
        <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
          Carregar arquivo
        </Button>
      </div>

      <label className="mt-4 block text-sm">
        <span className="text-[var(--text-secondary)]">Conteúdo ({format.toUpperCase()})</span>
        <textarea
          rows={8}
          className={fieldClass}
          value={content}
          placeholder={
            format === "json"
              ? '{ "entity": "patients", "rows": [ { "name": "...", "cpf": "..." } ] }'
              : "nome,cpf,data_nascimento\nMaria Silva,529.982.247-25,1990-05-15"
          }
          onChange={(event) => {
            setContent(event.target.value);
            setSummary(null);
            setError(null);
          }}
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={busy !== null}
          onClick={() => runImport(true)}
        >
          {busy === "dry-run" ? "Simulando..." : "Simular (dry-run)"}
        </Button>
        <Button
          type="button"
          variant="portal"
          disabled={busy !== null}
          onClick={() => runImport(false)}
        >
          {busy === "import" ? "Importando..." : "Importar"}
        </Button>
      </div>

      {error && (
        <Alert tone="danger" className="mt-4">
          {error}
        </Alert>
      )}

      {summary && (
        <div className="mt-4 space-y-3">
          <Alert tone={summary.errors > 0 ? "warning" : "success"}>{summary.message}</Alert>
          <div className="grid gap-2 text-sm sm:grid-cols-4">
            <div className="rounded border border-[var(--border-muted)] p-2">
              <div className="text-[var(--text-secondary)]">Total</div>
              <div className="text-lg font-semibold">{summary.total}</div>
            </div>
            <div className="rounded border border-[var(--border-muted)] p-2">
              <div className="text-[var(--text-secondary)]">
                {summary.dryRun ? "Válidos" : "Criados"}
              </div>
              <div className="text-lg font-semibold text-emerald-700">{summary.created}</div>
            </div>
            <div className="rounded border border-[var(--border-muted)] p-2">
              <div className="text-[var(--text-secondary)]">Ignorados</div>
              <div className="text-lg font-semibold">{summary.skipped}</div>
            </div>
            <div className="rounded border border-[var(--border-muted)] p-2">
              <div className="text-[var(--text-secondary)]">Erros</div>
              <div className="text-lg font-semibold text-red-700">{summary.errors}</div>
            </div>
          </div>
          {summary.rows.length > 0 && (
            <ul className="max-h-48 overflow-y-auto rounded border border-[var(--border-muted)] text-xs">
              {summary.rows.map((row) => (
                <li
                  key={`${row.row}-${row.identifier ?? row.message}`}
                  className="border-b border-[var(--border-default)] px-3 py-2 last:border-0"
                >
                  <span className="font-medium">#{row.row}</span>{" "}
                  <span
                    className={
                      row.status === "error"
                        ? "text-red-700"
                        : row.status === "skipped"
                          ? "text-amber-700"
                          : "text-emerald-700"
                    }
                  >
                    {row.status}
                  </span>{" "}
                  — {row.message}
                  {row.identifier ? ` (${row.identifier})` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
