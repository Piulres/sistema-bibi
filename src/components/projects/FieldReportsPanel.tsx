"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";

type FieldReport = {
  id: string;
  reportDate: string;
  tradeLabel: string;
  authorName: string;
  workDone: string;
  pendingWork: string | null;
  locationNote: string | null;
  diariaAmount: number | null;
  status: string;
  statusLabel: string;
  invoiceId: string | null;
  attachments: { id: string; fileName: string; downloadUrl: string }[];
};

export default function FieldReportsPanel({ projectId }: { projectId: string }) {
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/interno/projects/${projectId}/field-reports`);
    const json = await res.json();
    if (res.ok) setReports(json.reports as FieldReport[]);
  }, [projectId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch(`/api/interno/projects/${projectId}/field-reports`);
      const json = await res.json();
      if (!active) return;
      if (res.ok) setReports(json.reports as FieldReport[]);
    })();
    return () => {
      active = false;
    };
  }, [projectId]);

  async function approve(reportId: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/interno/projects/${projectId}/field-reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", reportId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error ?? "Erro ao aprovar");
        return;
      }
      setMsg(json.invoiceId ? "RDO aprovado e diária faturada" : "RDO aprovado");
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (reports.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        Nenhum registro de campo enviado pela equipe ainda.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {msg && <Alert tone="info">{msg}</Alert>}
      <ul className="space-y-3">
        {reports.map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-[var(--text-primary)]">
                  {new Date(r.reportDate).toLocaleDateString("pt-BR")} · {r.tradeLabel} ·{" "}
                  {r.authorName}
                </p>
                {r.locationNote && (
                  <p className="text-xs text-[var(--text-muted)]">Local: {r.locationNote}</p>
                )}
              </div>
              <span className="text-sm text-[var(--text-secondary)]">{r.statusLabel}</span>
            </div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{r.workDone}</p>
            {r.pendingWork && (
              <p className="mt-1 text-sm text-amber-800">
                <strong>Pendências:</strong> {r.pendingWork}
              </p>
            )}
            {r.diariaAmount != null && (
              <p className="mt-1 text-sm">
                Diária:{" "}
                {r.diariaAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            )}
            {r.attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {r.attachments.map((a) => (
                  <a
                    key={a.id}
                    href={a.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[var(--brand-primary)] hover:underline"
                  >
                    {a.fileName}
                  </a>
                ))}
              </div>
            )}
            {r.status === "ENVIADO" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => approve(r.id)}
                className="mt-3 rounded-md bg-emerald-600 px-3 py-1.5 text-xs text-white disabled:opacity-50"
              >
                Aprovar{r.diariaAmount ? " e faturar diária" : ""}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
