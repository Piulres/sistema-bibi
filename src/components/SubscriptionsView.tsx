"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";

type Subscription = {
  id: string;
  status: string;
  statusLabel: string;
  billingCycleLabel: string;
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
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [charges, setCharges] = useState<Charge[]>([]);

  const [form, setForm] = useState({
    patientId: "",
    billingCycle: "MENSAL",
    amount: "89.90",
    description: "Plano corporativo recorrente",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/interno/subscriptions");
    const data = await res.json();
    setSubscriptions(data.subscriptions ?? []);
    setPatients(data.patients ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/interno/subscriptions");
      const data = await res.json();
      if (!active) return;
      setSubscriptions(data.subscriptions ?? []);
      setPatients(data.patients ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function createSubscription(e: React.FormEvent) {
    e.preventDefault();
    setBusy("create");
    setMsg(null);
    try {
      const res = await fetch("/api/interno/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: form.patientId,
          billingCycle: form.billingCycle,
          amount: Number(form.amount),
          description: form.description,
          startDate: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao criar assinatura");
      else {
        setMsg(`Assinatura criada para ${data.subscription.patientName}`);
        await load();
      }
    } finally {
      setBusy(null);
    }
  }

  async function updateStatus(id: string, status: string) {
    setBusy(id);
    setMsg(null);
    try {
      const res = await fetch(`/api/interno/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao atualizar");
      else await load();
    } finally {
      setBusy(null);
    }
  }

  async function generateCharges(id: string, patientName: string) {
    setBusy(`gen-${id}`);
    setMsg(null);
    try {
      const res = await fetch(`/api/interno/subscriptions/${id}/generate-charges`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao gerar cobranças");
      else {
        setMsg(`${data.generatedCount} cobrança(s) geradas para ${patientName}`);
        await load();
        if (expanded === id) await loadCharges(id);
      }
    } finally {
      setBusy(null);
    }
  }

  async function loadCharges(id: string) {
    setExpanded(id);
    const res = await fetch(`/api/interno/subscriptions/${id}/charges`);
    const data = await res.json();
    setCharges(data.charges ?? []);
  }

  async function invoiceCharge(chargeId: string, patientName: string) {
    setBusy(`inv-${chargeId}`);
    setMsg(null);
    try {
      const res = await fetch(`/api/interno/subscriptions/charges/${chargeId}/invoice`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao faturar cobrança");
      else {
        setMsg(`Fatura emitida para ${patientName}: ${data.invoice.totalLabel}`);
        await load();
        if (expanded) await loadCharges(expanded);
      }
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <LoadingState message="Carregando assinaturas..." />;

  return (
    <div className="space-y-8">
      {msg && <Alert tone="info">{msg}</Alert>}

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
            <Button type="submit" variant="portal" disabled={busy === "create"}>
              {busy === "create" ? "Salvando..." : "Criar assinatura"}
            </Button>
          </div>
        </form>
      </Card>

      <section>
        <SectionHeader title="Assinaturas ativas" />
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
                      {sub.amountLabel}
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
                      disabled={busy === sub.id}
                      onChange={(e) => updateStatus(sub.id, e.target.value)}
                    >
                      <option value="ATIVA">Ativa</option>
                      <option value="SUSPENSA">Suspensa</option>
                      <option value="CANCELADA">Cancelada</option>
                    </select>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busy === `gen-${sub.id}` || sub.status !== "ATIVA"}
                      onClick={() => generateCharges(sub.id, sub.patientName)}
                    >
                      {busy === `gen-${sub.id}` ? "Gerando..." : "Gerar cobranças"}
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
                              disabled={busy === `inv-${charge.id}`}
                              onClick={() => invoiceCharge(charge.id, sub.patientName)}
                            >
                              {busy === `inv-${charge.id}` ? "..." : "Faturar"}
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
  );
}
