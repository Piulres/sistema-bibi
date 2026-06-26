"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import StatusBadge from "@/components/ui/StatusBadge";
import { budgetStatusLabel } from "@/lib/project/constants";

type ProjectRow = {
  id: string;
  code: string;
  name: string;
  status: string;
  statusLabel: string;
  progressPercent: number;
  budgetTotal: number | null;
  budgetStatus: string | null;
  budgetId: string | null;
  sentAt: string | null;
};

function formatBrl(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PjProjectsView() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/pj/projects");
        const json = await res.json();
        if (!active) return;
        if (!res.ok) {
          setError(json.error ?? "Falha ao carregar obras");
          return;
        }
        setProjects(json.projects as ProjectRow[]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <LoadingState message="Carregando obras…" />;
  if (error) return <Alert tone="danger">{error}</Alert>;

  if (projects.length === 0) {
    return (
      <EmptyState
        title="Nenhuma obra vinculada"
        message="Quando a operadora enviar propostas para sua empresa, elas aparecerão aqui."
      />
    );
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => {
        const pendingApproval = project.budgetStatus === "ENVIADO";
        return (
          <Link
            key={project.id}
            href={`/pj/projetos/${project.id}`}
            className="block rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 transition hover:border-[var(--border-accent)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  {project.code}
                </p>
                <p className="font-semibold text-[var(--text-primary)]">{project.name}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {formatBrl(project.budgetTotal)}
                  {project.budgetStatus
                    ? ` · Orçamento: ${budgetStatusLabel(project.budgetStatus)}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge value={project.status} label={project.statusLabel} />
                {pendingApproval && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                    Aguardando aprovação
                  </span>
                )}
                <span className="text-sm text-[var(--text-muted)]">{project.progressPercent}%</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
