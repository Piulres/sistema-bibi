"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";
import StatusBadge from "@/components/ui/StatusBadge";
import ScheduleTimeline from "@/components/projects/ScheduleTimeline";

type LineItem = {
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type Budget = {
  id: string;
  version: number;
  status: string;
  statusLabel: string;
  subtotal: number;
  bdiPercent: number;
  total: number;
  notes: string | null;
  approvedAt?: string | null;
  invoiceId?: string | null;
  lineItems: LineItem[];
};

type Task = {
  id: string;
  name: string;
  phaseLabel: string;
  statusLabel: string;
  startDate: string | null;
  endDate: string | null;
  progressPercent: number;
  dependsOnName: string | null;
};

type Attachment = {
  id: string;
  fileName: string;
  categoryLabel: string;
  sizeBytes: number;
  createdAt: string;
  downloadUrl: string;
};

type Project = {
  id: string;
  code: string;
  name: string;
  status: string;
  statusLabel: string;
  progressPercent: number;
  addressCity: string | null;
  addressState: string | null;
  managerName: string | null;
  startDate: string | null;
  endDate: string | null;
  budgets: Budget[];
  tasks: Task[];
  attachments: Attachment[];
};

type Tab = "resumo" | "proposta" | "cronograma" | "anexos";

function formatBrl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PjProjectDetailView({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("resumo");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/pj/projects/${projectId}`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Erro ao carregar obra");
      return;
    }
    setProject(json.project as Project);
    setError(null);
  }, [projectId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch(`/api/pj/projects/${projectId}`);
      const json = await res.json();
      if (!active) return;
      if (!res.ok) setError(json.error ?? "Erro ao carregar obra");
      else setProject(json.project as Project);
    })();
    return () => {
      active = false;
    };
  }, [projectId]);

  const activeBudget =
    project?.budgets.find((b) => b.status !== "SUBSTITUIDO") ?? project?.budgets[0];

  async function budgetAction(action: "approve" | "reject") {
    if (!activeBudget) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/pj/projects/${projectId}/budgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, budgetId: activeBudget.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error ?? "Erro na operação");
        return;
      }
      setMsg(action === "approve" ? "Proposta aprovada — fatura emitida" : "Proposta recusada");
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (error) return <Alert tone="danger">{error}</Alert>;
  if (!project) return <LoadingState message="Carregando obra…" />;

  const tabs: { key: Tab; label: string }[] = [
    { key: "resumo", label: "Resumo" },
    { key: "proposta", label: "Proposta" },
    { key: "cronograma", label: "Cronograma" },
    { key: "anexos", label: "Anexos" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/pj/projetos" className="text-sm text-[var(--brand-accent)] hover:underline">
            ← Voltar às obras
          </Link>
          <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
            {project.code} — {project.name}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {project.addressCity}
            {project.addressState ? ` / ${project.addressState}` : ""}
            {project.managerName ? ` · Resp.: ${project.managerName}` : ""}
          </p>
        </div>
        <StatusBadge value={project.status} label={project.statusLabel} />
      </div>

      {msg && <Alert tone="info">{msg}</Alert>}

      <nav className="flex flex-wrap gap-2 border-b border-[var(--border-default)] pb-px">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "border-[var(--brand-accent)] text-[var(--brand-accent)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--brand-accent)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "resumo" && (
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
            <dt className="text-xs uppercase text-[var(--text-muted)]">Status</dt>
            <dd className="mt-1 font-medium">{project.statusLabel}</dd>
          </div>
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
            <dt className="text-xs uppercase text-[var(--text-muted)]">Progresso</dt>
            <dd className="mt-1 font-medium">{project.progressPercent}%</dd>
          </div>
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
            <dt className="text-xs uppercase text-[var(--text-muted)]">Período</dt>
            <dd className="mt-1 font-medium">
              {formatDate(project.startDate)} → {formatDate(project.endDate)}
            </dd>
          </div>
          {activeBudget && (
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 sm:col-span-2">
              <dt className="text-xs uppercase text-[var(--text-muted)]">Orçamento atual</dt>
              <dd className="mt-1 font-medium">
                v{activeBudget.version} · {activeBudget.statusLabel} · {formatBrl(activeBudget.total)}
              </dd>
            </div>
          )}
        </dl>
      )}

      {tab === "proposta" && activeBudget && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Versão {activeBudget.version} · {activeBudget.statusLabel}
            </span>
            <span className="font-medium">{formatBrl(activeBudget.total)}</span>
            <a
              href={`/api/pj/projects/${projectId}/budgets/${activeBudget.id}/pdf`}
              className="text-[var(--brand-primary)] hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Baixar PDF
            </a>
          </div>

          {activeBudget.status === "ENVIADO" && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => budgetAction("approve")}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                Aprovar proposta
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => budgetAction("reject")}
                className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 disabled:opacity-50"
              >
                Recusar proposta
              </button>
            </div>
          )}

          {activeBudget.status === "APROVADO" && (
            <p className="text-sm text-[var(--text-secondary)]">
              Proposta aprovada em {formatDate(activeBudget.approvedAt ?? null)}.
              {activeBudget.invoiceId && (
                <>
                  {" "}
                  Fatura emitida — consulte a aba <strong>Faturas</strong> no portal.
                </>
              )}
            </p>
          )}

          {activeBudget.status === "REJEITADO" && (
            <p className="text-sm text-[var(--text-secondary)]">Proposta recusada pela empresa.</p>
          )}

          <ul className="divide-y rounded-xl border border-[var(--border-default)]">
            {activeBudget.lineItems.map((li, i) => (
              <li key={i} className="flex justify-between px-4 py-2 text-sm">
                <span>
                  {li.description} ({li.quantity} {li.unit})
                </span>
                <span>{formatBrl(li.total)}</span>
              </li>
            ))}
          </ul>

          {activeBudget.notes && (
            <p className="text-sm text-[var(--text-secondary)]">
              <strong>Observações:</strong> {activeBudget.notes}
            </p>
          )}
        </div>
      )}

      {tab === "cronograma" && (
        <div className="space-y-4">
          {project.tasks.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Cronograma ainda não publicado.</p>
          ) : (
            <>
              <ScheduleTimeline tasks={project.tasks} />
              <div className="space-y-3">
                {project.tasks.map((task) => (
                  <article
                    key={task.id}
                    className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4"
                  >
                    <p className="font-medium">{task.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {task.phaseLabel} · {task.statusLabel}
                      {task.dependsOnName ? ` · Depende de: ${task.dependsOnName}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {formatDate(task.startDate)} → {formatDate(task.endDate)} · {task.progressPercent}%
                    </p>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "anexos" && (
        <ul className="divide-y rounded-xl border border-[var(--border-default)]">
          {project.attachments.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
              Nenhum documento compartilhado.
            </li>
          )}
          {project.attachments.map((att) => (
            <li key={att.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <a
                  href={att.downloadUrl}
                  className="font-medium text-[var(--brand-primary)] hover:underline"
                >
                  {att.fileName}
                </a>
                <p className="text-xs text-[var(--text-muted)]">
                  {att.categoryLabel} · {formatBytes(att.sizeBytes)} ·{" "}
                  {new Date(att.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
