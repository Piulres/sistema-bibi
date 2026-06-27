"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";
import {
  ATTACHMENT_CATEGORIES,
  TASK_PHASES,
  projectStatusLabel,
} from "@/lib/project/constants";
import ScheduleTimeline from "@/components/projects/ScheduleTimeline";
import FieldReportsPanel from "@/components/projects/FieldReportsPanel";
import ProjectCashPanel from "@/components/projects/ProjectCashPanel";
import ProjectAllocationsPanel from "@/components/projects/ProjectAllocationsPanel";
import ProjectEnvironmentsPanel from "@/components/projects/ProjectEnvironmentsPanel";
import ProjectBdiPanel from "@/components/projects/ProjectBdiPanel";
import ProjectContractsPanel from "@/components/projects/ProjectContractsPanel";
import ProjectFinancialPanel from "@/components/projects/ProjectFinancialPanel";

type LineItem = {
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
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
  phase: string;
  phaseLabel: string;
  status: string;
  statusLabel: string;
  startDate: string | null;
  endDate: string | null;
  progressPercent: number;
  assigneeName: string | null;
  dependsOnId: string | null;
  dependsOnName: string | null;
};

type Attachment = {
  id: string;
  fileName: string;
  categoryLabel: string;
  sizeBytes: number;
  createdAt: string;
  downloadUrl: string;
  entityType: string;
};

type Project = {
  id: string;
  code: string;
  name: string;
  status: string;
  statusLabel: string;
  progressPercent: number;
  notes: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  companyName: string | null;
  managerName: string | null;
  startDate: string | null;
  endDate: string | null;
  budgets: Budget[];
  tasks: Task[];
  attachments: Attachment[];
};

type Tab =
  | "resumo"
  | "orcamento"
  | "ambientes"
  | "bdi"
  | "cronograma"
  | "financeiro"
  | "caixa"
  | "equipe"
  | "campo"
  | "contratos"
  | "anexos";

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

export default function ProjectDetailView({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("resumo");
  const [busy, setBusy] = useState(false);

  const [budgetForm, setBudgetForm] = useState<{
    bdiPercent: number;
    notes: string;
    lineItems: LineItem[];
  }>({ bdiPercent: 0, notes: "", lineItems: [] });

  const [taskForm, setTaskForm] = useState({
    name: "",
    phase: "GERAL",
    status: "PENDENTE",
    startDate: "",
    endDate: "",
    progressPercent: 0,
    dependsOnId: "",
  });

  const [uploadCategory, setUploadCategory] = useState("PLANTA");

  const load = useCallback(async () => {
    const res = await fetch(`/api/interno/projects/${projectId}`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Erro ao carregar obra");
      return;
    }
    const p = json.project as Project;
    setProject(p);
    const active = p.budgets.find((b) => b.status !== "SUBSTITUIDO") ?? p.budgets[0];
    if (active) {
      setBudgetForm({
        bdiPercent: active.bdiPercent,
        notes: active.notes ?? "",
        lineItems:
          active.lineItems.length > 0
            ? active.lineItems.map((li) => ({
                description: li.description,
                unit: li.unit,
                quantity: li.quantity,
                unitPrice: li.unitPrice,
              }))
            : [{ description: "", unit: "un", quantity: 1, unitPrice: 0 }],
      });
    }
    setError(null);
  }, [projectId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch(`/api/interno/projects/${projectId}`);
      const json = await res.json();
      if (!active) return;
      if (!res.ok) setError(json.error ?? "Erro ao carregar obra");
      else {
        const p = json.project as Project;
        setProject(p);
        const b = p.budgets.find((x) => x.status !== "SUBSTITUIDO") ?? p.budgets[0];
        if (b) {
          setBudgetForm({
            bdiPercent: b.bdiPercent,
            notes: b.notes ?? "",
            lineItems:
              b.lineItems.length > 0
                ? b.lineItems.map((li) => ({
                    description: li.description,
                    unit: li.unit,
                    quantity: li.quantity,
                    unitPrice: li.unitPrice,
                  }))
                : [{ description: "", unit: "un", quantity: 1, unitPrice: 0 }],
          });
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [projectId]);

  const activeBudget = project?.budgets.find((b) => b.status !== "SUBSTITUIDO") ?? project?.budgets[0];

  async function saveBudget() {
    if (!activeBudget) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/interno/projects/${projectId}/budgets`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetId: activeBudget.id,
          bdiPercent: budgetForm.bdiPercent,
          notes: budgetForm.notes,
          lineItems: budgetForm.lineItems.filter((li) => li.description.trim()),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error ?? "Erro ao salvar orçamento");
        return;
      }
      setMsg("Orçamento salvo");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function budgetAction(action: "send" | "approve" | "reject" | "new-version") {
    if (!activeBudget) return;
    setBusy(true);
    setMsg(null);
    try {
      const body: Record<string, string> = { action };
      if (action === "new-version") body.sourceBudgetId = activeBudget.id;
      else body.budgetId = activeBudget.id;

      const res = await fetch(`/api/interno/projects/${projectId}/budgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error ?? "Erro na operação");
        return;
      }
      setMsg(
        action === "send"
          ? "Proposta enviada"
          : action === "approve"
            ? "Orçamento aprovado — fatura emitida"
            : action === "reject"
              ? "Proposta recusada"
              : "Nova versão criada",
      );
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/interno/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskForm,
          startDate: taskForm.startDate || null,
          endDate: taskForm.endDate || null,
          dependsOnId: taskForm.dependsOnId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error ?? "Erro ao adicionar tarefa");
        return;
      }
      setTaskForm({
        name: "",
        phase: "GERAL",
        status: "PENDENTE",
        startDate: "",
        endDate: "",
        progressPercent: 0,
        dependsOnId: "",
      });
      setMsg("Tarefa adicionada");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !project) return;
    setBusy(true);
    setMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("entityType", "Project");
      form.append("entityId", project.id);
      form.append("category", uploadCategory);

      const res = await fetch("/api/interno/attachments", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error ?? "Erro no upload");
        return;
      }
      setMsg(`Anexo ${file.name} enviado`);
      await load();
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function removeAttachment(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/interno/attachments?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        setMsg(json.error ?? "Erro ao remover");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (error) return <Alert tone="danger">{error}</Alert>;
  if (!project) return <LoadingState message="Carregando obra..." />;

  const tabs: { id: Tab; label: string }[] = [
    { id: "resumo", label: "Resumo" },
    { id: "orcamento", label: "Orçamento" },
    { id: "ambientes", label: "Ambientes" },
    { id: "bdi", label: "BDI" },
    { id: "cronograma", label: "Cronograma" },
    { id: "financeiro", label: "Físico-financeiro" },
    { id: "caixa", label: "Caixa" },
    { id: "equipe", label: "Equipe" },
    { id: "campo", label: "Campo" },
    { id: "contratos", label: "Contratos" },
    { id: "anexos", label: `Anexos (${project.attachments.length})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/interno/projetos"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            ← Voltar às obras
          </Link>
          <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
            {project.code} — {project.name}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {projectStatusLabel(project.status)}
            {project.companyName ? ` · ${project.companyName}` : ""}
            {project.managerName ? ` · ${project.managerName}` : ""}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="font-medium text-[var(--text-primary)]">{project.progressPercent}% concluído</p>
          {activeBudget && (
            <p className="text-[var(--text-secondary)]">{formatBrl(activeBudget.total)}</p>
          )}
        </div>
      </div>

      {msg && <Alert tone="info">{msg}</Alert>}

      <div className="flex flex-wrap gap-2 border-b border-[var(--border-default)] pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === t.id
                ? "bg-[var(--brand-primary)] text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resumo" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
            <h3 className="font-medium text-[var(--text-primary)]">Local</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {[project.addressStreet, project.addressCity, project.addressState]
                .filter(Boolean)
                .join(", ") || "Não informado"}
            </p>
          </section>
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
            <h3 className="font-medium text-[var(--text-primary)]">Prazo</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {formatDate(project.startDate)} → {formatDate(project.endDate)}
            </p>
          </section>
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 sm:col-span-2">
            <h3 className="font-medium text-[var(--text-primary)]">Observações</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {project.notes || "—"}
            </p>
          </section>
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 sm:col-span-2">
            <h3 className="mb-3 font-medium text-[var(--text-primary)]">Progresso geral</h3>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-orange-500 transition-all"
                style={{ width: `${Math.min(100, project.progressPercent)}%` }}
              />
            </div>
          </section>
        </div>
      )}

      {tab === "orcamento" && activeBudget && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Versão {activeBudget.version} · {activeBudget.statusLabel}
            </span>
            <span className="font-medium">{formatBrl(activeBudget.total)}</span>
            <a
              href={`/api/interno/projects/${projectId}/budgets/${activeBudget.id}/pdf`}
              className="text-[var(--brand-primary)] hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Baixar PDF
            </a>
          </div>

          {activeBudget.status === "RASCUNHO" && (
            <>
              <div className="overflow-x-auto rounded-xl border border-[var(--border-default)]">
                <table className="min-w-full text-sm">
                  <thead className="bg-[var(--surface-muted)] text-left text-xs uppercase text-[var(--text-muted)]">
                    <tr>
                      <th className="px-3 py-2">Descrição</th>
                      <th className="px-3 py-2">Un</th>
                      <th className="px-3 py-2">Qtd</th>
                      <th className="px-3 py-2">Preço un.</th>
                      <th className="px-3 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetForm.lineItems.map((li, idx) => (
                      <tr key={idx} className="border-t border-[var(--border-default)]">
                        <td className="px-2 py-1">
                          <input
                            value={li.description}
                            onChange={(e) => {
                              const items = [...budgetForm.lineItems];
                              items[idx] = { ...items[idx], description: e.target.value };
                              setBudgetForm((f) => ({ ...f, lineItems: items }));
                            }}
                            className="w-full min-w-[12rem] rounded border px-2 py-1"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            value={li.unit}
                            onChange={(e) => {
                              const items = [...budgetForm.lineItems];
                              items[idx] = { ...items[idx], unit: e.target.value };
                              setBudgetForm((f) => ({ ...f, lineItems: items }));
                            }}
                            className="w-16 rounded border px-2 py-1"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="number"
                            value={li.quantity}
                            onChange={(e) => {
                              const items = [...budgetForm.lineItems];
                              items[idx] = { ...items[idx], quantity: Number(e.target.value) };
                              setBudgetForm((f) => ({ ...f, lineItems: items }));
                            }}
                            className="w-20 rounded border px-2 py-1"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="number"
                            value={li.unitPrice}
                            onChange={(e) => {
                              const items = [...budgetForm.lineItems];
                              items[idx] = { ...items[idx], unitPrice: Number(e.target.value) };
                              setBudgetForm((f) => ({ ...f, lineItems: items }));
                            }}
                            className="w-24 rounded border px-2 py-1"
                          />
                        </td>
                        <td className="px-3 py-1 text-[var(--text-secondary)]">
                          {formatBrl(li.quantity * li.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={() =>
                  setBudgetForm((f) => ({
                    ...f,
                    lineItems: [...f.lineItems, { description: "", unit: "un", quantity: 1, unitPrice: 0 }],
                  }))
                }
                className="text-sm text-[var(--brand-accent)] hover:underline"
              >
                + Adicionar item
              </button>
              <label className="block text-sm">
                BDI (%)
                <input
                  type="number"
                  value={budgetForm.bdiPercent}
                  onChange={(e) =>
                    setBudgetForm((f) => ({ ...f, bdiPercent: Number(e.target.value) }))
                  }
                  className="mt-1 w-32 rounded border px-3 py-2"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={saveBudget}
                  className="rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  Salvar orçamento
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => budgetAction("send")}
                  className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 disabled:opacity-50"
                >
                  Enviar proposta
                </button>
              </div>
            </>
          )}

          {activeBudget.status === "ENVIADO" && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => budgetAction("approve")}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                Aprovar orçamento
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => budgetAction("reject")}
                className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 disabled:opacity-50"
              >
                Recusar proposta
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => budgetAction("new-version")}
                className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
              >
                Nova revisão
              </button>
            </div>
          )}

          {activeBudget.status === "APROVADO" && (
            <p className="text-sm text-[var(--text-secondary)]">
              Orçamento aprovado em {formatDate(activeBudget.approvedAt ?? null)}.
              {activeBudget.invoiceId && (
                <>
                  {" "}
                  Fatura{" "}
                  <Link
                    href={`/interno?invoice=${activeBudget.invoiceId}`}
                    className="text-[var(--brand-primary)] hover:underline"
                  >
                    {activeBudget.invoiceId.slice(0, 8)}
                  </Link>{" "}
                  emitida.
                </>
              )}
            </p>
          )}

          {activeBudget.lineItems.length > 0 && activeBudget.status !== "RASCUNHO" && (
            <ul className="divide-y rounded-xl border border-[var(--border-default)]">
              {activeBudget.lineItems.map((li, i) => (
                <li key={i} className="flex justify-between px-4 py-2 text-sm">
                  <span>
                    {li.description} ({li.quantity} {li.unit})
                  </span>
                  <span>{formatBrl(li.quantity * li.unitPrice)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "cronograma" && (
        <div className="space-y-4">
          <form
            onSubmit={addTask}
            className="grid gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <label className="text-sm sm:col-span-2 lg:col-span-3">
              Tarefa
              <input
                required
                value={taskForm.name}
                onChange={(e) => setTaskForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="Fundação — estacas"
              />
            </label>
            <label className="text-sm">
              Fase
              <select
                value={taskForm.phase}
                onChange={(e) => setTaskForm((f) => ({ ...f, phase: e.target.value }))}
                className="mt-1 w-full rounded border px-3 py-2"
              >
                {TASK_PHASES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Início
              <input
                type="date"
                value={taskForm.startDate}
                onChange={(e) => setTaskForm((f) => ({ ...f, startDate: e.target.value }))}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Fim
              <input
                type="date"
                value={taskForm.endDate}
                onChange={(e) => setTaskForm((f) => ({ ...f, endDate: e.target.value }))}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </label>
            {project.tasks.length > 0 && (
              <label className="text-sm sm:col-span-2">
                Depende de
                <select
                  value={taskForm.dependsOnId}
                  onChange={(e) => setTaskForm((f) => ({ ...f, dependsOnId: e.target.value }))}
                  className="mt-1 w-full rounded border px-3 py-2"
                >
                  <option value="">Nenhuma</option>
                  {project.tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                disabled={busy}
                className="rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                Adicionar ao cronograma
              </button>
            </div>
          </form>

          {project.tasks.length > 0 && <ScheduleTimeline tasks={project.tasks} />}

          <div className="space-y-3">
            {project.tasks.length === 0 && (
              <p className="text-sm text-[var(--text-muted)]">Nenhuma tarefa no cronograma.</p>
            )}
            {project.tasks.map((task) => (
              <article
                key={task.id}
                className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{task.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {task.phaseLabel} · {task.statusLabel}
                      {task.assigneeName ? ` · ${task.assigneeName}` : ""}
                      {task.dependsOnName ? ` · Depende de: ${task.dependsOnName}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {formatDate(task.startDate)} → {formatDate(task.endDate)}
                    </p>
                  </div>
                  <span className="text-sm font-medium">{task.progressPercent}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-orange-500"
                    style={{ width: `${Math.min(100, task.progressPercent)}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === "ambientes" && <ProjectEnvironmentsPanel projectId={projectId} />}

      {tab === "bdi" && (
        <ProjectBdiPanel projectId={projectId} budgetId={activeBudget?.id} />
      )}

      {tab === "financeiro" && <ProjectFinancialPanel projectId={projectId} />}

      {tab === "caixa" && <ProjectCashPanel projectId={projectId} />}

      {tab === "equipe" && <ProjectAllocationsPanel projectId={projectId} />}

      {tab === "campo" && <FieldReportsPanel projectId={projectId} />}

      {tab === "contratos" && <ProjectContractsPanel projectId={projectId} />}

      {tab === "anexos" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)]/40 p-4">
            <label className="text-sm">
              Categoria
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="mt-1 block rounded border px-3 py-2"
              >
                {ATTACHMENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Arquivo (PDF, PNG, JPG — máx. 10 MB)
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                disabled={busy}
                onChange={uploadFile}
                className="mt-1 block text-sm"
              />
            </label>
          </div>

          <ul className="divide-y rounded-xl border border-[var(--border-default)]">
            {project.attachments.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                Nenhum documento anexado.
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
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => removeAttachment(att.id)}
                  className="text-xs text-red-600 hover:underline disabled:opacity-50"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
