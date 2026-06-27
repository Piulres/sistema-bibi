"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import ExportButtons from "@/components/ExportButtons";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { fetchJson } from "@/lib/ui/api-feedback";
import { confirmPresets } from "@/lib/ui/confirm-presets";

type Subscription = {
  id: string;
  status: string;
  statusLabel: string;
  billingCycle: string;
  billingCycleLabel: string;
  amount: number;
  amountLabel: string;
  patientId: string;
  patientName: string;
  companyName: string | null;
  pendingCharges: number;
  nextDueDateLabel: string | null;
  description: string | null;
};

type Patient = { id: string; name: string };

type Charge = {
  id: string;
  dueDateLabel: string;
  amountLabel: string;
  status: string;
  invoiceId: string | null;
};

export default function SubscriptionsView() {
  const { isBusy, run, showToast } = useAsyncAction();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [editingAmountId, setEditingAmountId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");

  const [form, setForm] = useState({
    patientId: "",
    billingCycle: "MENSAL",
    amount: "89.90",
    description: "Plano corporativo recorrente",
  });

  const loadSubscriptions = useCallback(
    () =>
      fetchJson<{ subscriptions?: Subscription[]; patients?: Patient[] }>(
        "/api/interno/subscriptions",
        undefined,
        "Erro ao carregar assinaturas",
      ),
    [],
  );

  const { data, loading, error, reload } = useAsyncData(loadSubscriptions, [], {
    forbiddenMessage: "Sem permissão para acessar assinaturas",
  });

  const subscriptions = data?.subscriptions ?? [];
  const patients = data?.patients ?? [];

  async function loadCharges(id: string) {
    setExpanded(id);
    const result = await fetchJson<{ charges?: Charge[] }>(
      `/api/interno/subscriptions/${id}/charges`,
    );
    setCharges(result.ok ? (result.data.charges ?? []) : []);
  }

  async function createSubscription(e: React.FormEvent) {
    e.preventDefault();
    await run(
      "create",
      () =>
        fetch("/api/interno/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: form.patientId,
            billingCycle: form.billingCycle,
            amount: Number(form.amount),
            description: form.description,
            startDate: new Date().toISOString(),
          }),
        }),
      {
        silentSuccess: true,
        errorMessage: "Erro ao criar assinatura",
        onSuccess: async (body) => {
          const subscription = body.subscription as { patientName?: string } | undefined;
          showToast({
            message: `Assinatura criada para ${subscription?.patientName ?? "beneficiário"}`,
            tone: "success",
          });
          await reload();
        },
      },
    );
  }

  async function updateStatus(id: string, status: string, patientName: string) {
    await run(
      id,
      () =>
        fetch(`/api/interno/subscriptions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }),
      {
        confirm: status === "CANCELADA" ? confirmPresets.cancelSubscription(patientName) : undefined,
        silentSuccess: true,
        errorMessage: "Erro ao atualizar",
        onSuccess: () => reload(),
      },
    );
  }

  async function updateAmount(id: string) {
    const amount = Number(editAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast({ message: "Valor inválido", tone: "danger" });
      return;
    }
    await run(
      `amt-${id}`,
      () =>
        fetch(`/api/interno/subscriptions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        }),
      {
        silentSuccess: true,
        errorMessage: "Erro ao atualizar valor",
        onSuccess: async (body) => {
          const updated = (body.chargesUpdated as number | undefined) ?? 0;
          showToast({
            message:
              updated > 0
                ? `Valor atualizado. ${updated} cobrança(s) pendente(s) ajustada(s). Faturadas mantêm valor original.`
                : "Valor atualizado para novas cobranças.",
            tone: "info",
          });
          setEditingAmountId(null);
          await reload();
          if (expanded === id) await loadCharges(id);
        },
      },
    );
  }

  async function generateCharges(id: string, patientName: string) {
    await run(
      `gen-${id}`,
      () => fetch(`/api/interno/subscriptions/${id}/generate-charges`, { method: "POST" }),
      {
        silentSuccess: true,
        errorMessage: "Erro ao gerar cobranças",
        onSuccess: async (body) => {
          const count = (body.generatedCount as number | undefined) ?? 0;
          showToast({
            message: `${count} cobrança(s) geradas para ${patientName}`,
            tone: "success",
          });
          await reload();
          if (expanded === id) await loadCharges(id);
        },
      },
    );
  }

  async function invoiceCharge(chargeId: string, patientName: string) {
    await run(
      `inv-${chargeId}`,
      () => fetch(`/api/interno/subscriptions/charges/${chargeId}/invoice`, { method: "POST" }),
      {
        silentSuccess: true,
        errorMessage: "Erro ao faturar cobrança",
        onSuccess: async (body) => {
          const invoice = body.invoice as { totalLabel?: string } | undefined;
          showToast({
            message: `Fatura emitida para ${patientName}: ${invoice?.totalLabel ?? ""}`,
            tone: "success",
          });
          await reload();
          if (expanded) await loadCharges(expanded);
        },
      },
    );
  }

  return (
    <ViewStateBoundary
      loading={loading}
      error={error}
      loadingMessage="Carregando assinaturas..."
      onRetry={() => void reload()}
    >
      <div className="space-y-8">
        <Card>
          <SectionHeader title="Nova assinatura" />
          <form onSubmit={createSubscription} className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Beneficiário</span>
              <select
                required
                className="mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2"
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              >
                <option value="">Selecione...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Ciclo</span>
              <select
                className="mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2"
                value={form.billingCycle}
                onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}
              >
                <option value="MENSAL">Mensal</option>
                <option value="TRIMESTRAL">Trimestral</option>
                <option value="SEMESTRAL">Semestral</option>
                <option value="ANUAL">Anual</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Valor por ciclo (R$)</span>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                className="mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] px-3 py-2"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-[var(--text-secondary)]">Descrição</span>
              <input
                className="mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] px-3 py-2"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" variant="portal" disabled={isBusy("create")}>
                {isBusy("create") ? "Salvando..." : "Criar assinatura"}
              </Button>
            </div>
          </form>
        </Card>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeader title="Assinaturas ativas" />
            <ExportButtons baseUrl="/api/interno/subscriptions/export" />
          </div>
          {subscriptions.length === 0 ? (
            <EmptyState message="Nenhuma assinatura cadastrada." />
          ) : (
            <div className="mt-4 space-y-4">
              {subscriptions.map((sub) => (
                <Card key={sub.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/interno/beneficiarios/${sub.patientId}?from=/interno/assinaturas`}
                        className="font-semibold text-[var(--portal-accent)] hover:underline"
                      >
                        {sub.patientName}
                      </Link>
                      <p className="text-sm text-[var(--text-muted)]">
                        {sub.companyName ?? "Particular"} · {sub.billingCycleLabel} ·{" "}
                        {editingAmountId === sub.id ? (
                          <span className="inline-flex items-center gap-2">
                            R$
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              className="w-24 rounded border border-[var(--border-muted)] px-2 py-0.5 text-sm"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="portal"
                              disabled={isBusy(`amt-${sub.id}`)}
                              onClick={() => updateAmount(sub.id)}
                            >
                              Salvar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingAmountId(null)}
                            >
                              Cancelar
                            </Button>
                          </span>
                        ) : (
                          <>
                            {sub.amountLabel}
                            <button
                              type="button"
                              className="ml-2 text-xs text-[var(--portal-accent)] hover:underline"
                              onClick={() => {
                                setEditingAmountId(sub.id);
                                setEditAmount(String(sub.amount));
                              }}
                            >
                              Editar valor
                            </button>
                          </>
                        )}
                      </p>
                      {sub.description && (
                        <p className="mt-1 text-sm text-slate-600">{sub.description}</p>
                      )}
                      <p className="mt-2 text-xs text-slate-500">
                        {sub.pendingCharges} cobrança(s) pendente(s)
                        {sub.nextDueDateLabel ? ` · próxima: ${sub.nextDueDateLabel}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <select
                        className="rounded-[var(--radius-button)] border border-[var(--border-muted)] px-2 py-1.5 text-sm"
                        value={sub.status}
                        disabled={isBusy(sub.id)}
                        onChange={(e) => updateStatus(sub.id, e.target.value, sub.patientName)}
                      >
                        <option value="ATIVA">Ativa</option>
                        <option value="SUSPENSA">Suspensa</option>
                        <option value="CANCELADA">Cancelada</option>
                      </select>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isBusy(`gen-${sub.id}`) || sub.status !== "ATIVA"}
                        onClick={() => generateCharges(sub.id, sub.patientName)}
                      >
                        {isBusy(`gen-${sub.id}`) ? "Gerando..." : "Gerar cobranças"}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => loadCharges(sub.id)}>
                        Ver cobranças
                      </Button>
                    </div>
                  </div>

                  {expanded === sub.id && (
                    <ul className="mt-4 divide-y divide-[var(--border-default)] border-t border-[var(--border-default)]">
                      {charges.length === 0 && (
                        <li className="py-2 text-sm text-[var(--text-muted)]">Nenhuma cobrança gerada.</li>
                      )}
                      {charges.map((charge) => (
                        <li key={charge.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                          <span className="text-[var(--text-secondary)]">{charge.dueDateLabel}</span>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[var(--text-muted)]">
                              {charge.amountLabel} · {charge.status}
                            </span>
                            {charge.status === "PENDENTE" && !charge.invoiceId && (
                              <Button
                                variant="portal"
                                size="sm"
                                disabled={isBusy(`inv-${charge.id}`)}
                                onClick={() => invoiceCharge(charge.id, sub.patientName)}
                              >
                                {isBusy(`inv-${charge.id}`) ? "..." : "Faturar"}
                              </Button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </ViewStateBoundary>
  );
}
