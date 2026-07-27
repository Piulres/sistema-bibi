"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";
import { useRovingTablistKeyDown } from "@/components/ui/RovingTablist";
import { PROJECT_STATUSES, projectStatusLabel } from "@/lib/project/constants";
import { cn } from "@/lib/utils/cn";

type ProjectCard = {
  id: string;
  code: string;
  name: string;
  status: string;
  statusLabel: string;
  progressPercent: number;
  companyName: string | null;
  managerName: string | null;
  addressCity: string | null;
  budgetTotal: number | null;
  taskCount: number;
  attachmentCount: number;
};

type PipelineData = {
  statuses: string[];
  pipeline: Record<string, ProjectCard[]>;
};

function columnClass(status: string): string {
  switch (status) {
    case "ORCAMENTO":
      return "border-slate-200 bg-slate-50";
    case "PROPOSTA":
      return "border-amber-200 bg-amber-50";
    case "APROVADO":
      return "border-blue-200 bg-blue-50";
    case "EM_OBRA":
      return "border-orange-200 bg-orange-50";
    case "PARALISADO":
      return "border-red-200 bg-red-50";
    case "CONCLUIDO":
      return "border-emerald-200 bg-emerald-50";
    default:
      return "border-slate-200 bg-slate-50";
  }
}

function formatBrl(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ProjectPipelineCard({
  project,
  busy,
  onUpdate,
}: {
  project: ProjectCard;
  busy: boolean;
  onUpdate: (projectId: string, code: string, status: string) => void;
}) {
  return (
    <article className="rounded-lg border border-white/80 bg-white p-3 shadow-sm">
      <Link
        href={`/interno/projetos/${project.id}`}
        className="ds-touch-link px-0 font-medium text-slate-900"
      >
        {project.code}
      </Link>
      <p className="mt-0.5 break-words text-sm text-slate-800">{project.name}</p>
      {project.companyName && (
        <p className="mt-1 break-words text-xs text-slate-500">{project.companyName}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
        <span>{formatBrl(project.budgetTotal)}</span>
        <span>·</span>
        <span>{project.progressPercent}%</span>
        <span>·</span>
        <span>{project.taskCount} tarefas</span>
        <span>·</span>
        <span>{project.attachmentCount} anexos</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-orange-500"
          style={{ width: `${Math.min(100, project.progressPercent)}%` }}
        />
      </div>
      <label className="mt-3 block text-xs font-medium text-slate-500">
        Status
        <select
          className="mt-1 min-h-10 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800"
          value={project.status}
          disabled={busy}
          onChange={(event) => onUpdate(project.id, project.code, event.target.value)}
        >
          {PROJECT_STATUSES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}

export default function ProjectsView() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mobileStatus, setMobileStatus] = useState("");
  const [form, setForm] = useState({ code: "", name: "", addressCity: "", companyId: "" });
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/interno/projects?view=pipeline");
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Erro ao carregar obras");
      return;
    }
    setData(json);
    setError(null);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/interno/projects?view=pipeline");
      const json = await res.json();
      if (!active) return;
      if (!res.ok) setError(json.error ?? "Erro ao carregar obras");
      else setData(json);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!showForm) return;
    let active = true;
    (async () => {
      const res = await fetch("/api/interno/projects/meta");
      const json = await res.json();
      if (active && res.ok) setCompanies(json.companies ?? []);
    })();
    return () => {
      active = false;
    };
  }, [showForm]);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/interno/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          addressCity: form.addressCity || null,
          companyId: form.companyId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error ?? "Erro ao criar obra");
        return;
      }
      setMsg(`Obra ${json.project.code} criada`);
      setShowForm(false);
      setForm({ code: "", name: "", addressCity: "", companyId: "" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(projectId: string, code: string, status: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/interno/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error ?? "Erro ao atualizar status");
        return;
      }
      setMsg(`${code} → ${projectStatusLabel(status)}`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  const statusIds = useMemo(() => data?.statuses ?? [], [data?.statuses]);
  const activeMobileStatus =
    data && mobileStatus && data.statuses.includes(mobileStatus)
      ? mobileStatus
      : (data?.statuses[0] ?? "");
  const { tabProps } = useRovingTablistKeyDown(
    statusIds,
    activeMobileStatus,
    setMobileStatus,
  );

  if (error) return <Alert tone="danger">{error}</Alert>;
  if (!data) return <LoadingState message="Carregando obras..." />;

  return (
    <div className="space-y-6">
      {msg && <Alert tone="info">{msg}</Alert>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--text-secondary)]">
          Pipeline de obras — status, orçamentos e cronogramas.
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="min-h-10 rounded-[var(--radius-button)] bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white"
        >
          {showForm ? "Cancelar" : "Nova obra"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={createProject}
          className="grid gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 sm:grid-cols-2"
        >
          <label className="block text-sm">
            Código
            <input
              required
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="OBR-2026-001"
              className="mt-1 w-full rounded-md border border-[var(--border-default)] px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Nome da obra
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Reforma Torre A"
              className="mt-1 w-full rounded-md border border-[var(--border-default)] px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            Empresa contratante (PJ)
            <select
              value={form.companyId}
              onChange={(e) => setForm((f) => ({ ...f, companyId: e.target.value }))}
              className="mt-1 w-full rounded-md border border-[var(--border-default)] px-3 py-2"
            >
              <option value="">Sem vínculo (interno apenas)</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            Cidade
            <input
              value={form.addressCity}
              onChange={(e) => setForm((f) => ({ ...f, addressCity: e.target.value }))}
              placeholder="São Paulo"
              className="mt-1 w-full rounded-md border border-[var(--border-default)] px-3 py-2"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-[var(--radius-button)] bg-[var(--brand-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Criar obra
            </button>
          </div>
        </form>
      )}

      {/* Mobile: uma etapa por vez */}
      <div className="lg:hidden">
        <div className="ds-scroll-x flex gap-2 pb-1" role="tablist" aria-label="Etapas das obras">
          {data.statuses.map((status) => {
            const count = (data.pipeline[status] ?? []).length;
            const active = activeMobileStatus === status;
            return (
              <button
                key={status}
                type="button"
                {...tabProps(status)}
                onClick={() => setMobileStatus(status)}
                className={cn(
                  "min-h-10 shrink-0 rounded-full border px-3 py-2 text-sm font-medium transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]",
                  active
                    ? "border-[var(--brand-accent)] bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]"
                    : "border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)]",
                )}
              >
                {projectStatusLabel(status)}
                <span className="ml-1.5 text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {data.statuses
          .filter((status) => status === activeMobileStatus)
          .map((status) => {
            const cards = data.pipeline[status] ?? [];
            return (
              <div
                key={status}
                className={`mt-3 rounded-xl border p-3 ${columnClass(status)}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">
                    {projectStatusLabel(status)}
                  </h3>
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {cards.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {cards.length === 0 && (
                    <p className="rounded-lg bg-white/60 p-3 text-xs text-slate-500">
                      Nenhuma obra nesta etapa.
                    </p>
                  )}
                  {cards.map((project) => (
                    <ProjectPipelineCard
                      key={project.id}
                      project={project}
                      busy={busy}
                      onUpdate={updateStatus}
                    />
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      {/* Desktop: kanban horizontal */}
      <div className="hidden ds-scroll-x gap-4 pb-2 lg:flex">
        {data.statuses.map((status) => {
          const cards = data.pipeline[status] ?? [];
          return (
            <div
              key={status}
              className={`min-w-[17rem] flex-1 rounded-xl border p-3 ${columnClass(status)}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">
                  {projectStatusLabel(status)}
                </h3>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {cards.length}
                </span>
              </div>

              <div className="space-y-3">
                {cards.length === 0 && (
                  <p className="rounded-lg bg-white/60 p-3 text-xs text-slate-500">
                    Nenhuma obra nesta etapa.
                  </p>
                )}
                {cards.map((project) => (
                  <ProjectPipelineCard
                    key={project.id}
                    project={project}
                    busy={busy}
                    onUpdate={updateStatus}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
