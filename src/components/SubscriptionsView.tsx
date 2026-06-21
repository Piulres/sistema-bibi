"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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

  if (loading) return <p className="text-slate-500">Carregando assinaturas...</p>;

  return (
    <div className="space-y-8">
      {msg && (
        <p className="rounded-lg bg-indigo-50 px-4 py-2 text-sm text-indigo-800">{msg}</p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Nova assinatura</h2>
        <form onSubmit={createSubscription} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-600">Beneficiário</span>
            <select
              required
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
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
            <span className="text-slate-600">Ciclo</span>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
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
            <span className="text-slate-600">Valor por ciclo (R$)</span>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600">Descrição</span>
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy === "create"}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {busy === "create" ? "Salvando..." : "Criar assinatura"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Assinaturas ativas</h2>
        {subscriptions.length === 0 ? (
          <p className="mt-4 rounded-lg bg-white p-4 text-slate-500">
            Nenhuma assinatura cadastrada.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {subscriptions.map((sub) => (
              <article
                key={sub.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/interno/beneficiarios/${sub.patientId}`}
                      className="font-semibold text-indigo-700 hover:underline"
                    >
                      {sub.patientName}
                    </Link>
                    <p className="text-sm text-slate-500">
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
                      className="rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                      value={sub.status}
                      disabled={busy === sub.id}
                      onChange={(e) => updateStatus(sub.id, e.target.value)}
                    >
                      <option value="ATIVA">Ativa</option>
                      <option value="SUSPENSA">Suspensa</option>
                      <option value="CANCELADA">Cancelada</option>
                    </select>
                    <button
                      type="button"
                      disabled={busy === `gen-${sub.id}` || sub.status !== "ATIVA"}
                      onClick={() => generateCharges(sub.id, sub.patientName)}
                      className="rounded-lg border border-indigo-200 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                    >
                      {busy === `gen-${sub.id}` ? "Gerando..." : "Gerar cobranças"}
                    </button>
                    <button
                      type="button"
                      onClick={() => loadCharges(sub.id)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Ver cobranças
                    </button>
                  </div>
                </div>

                {expanded === sub.id && (
                  <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
                    {charges.length === 0 && (
                      <li className="py-2 text-sm text-slate-500">Nenhuma cobrança gerada.</li>
                    )}
                    {charges.map((charge) => (
                      <li key={charge.id} className="flex justify-between py-2 text-sm">
                        <span className="text-slate-700">{charge.dueDateLabel}</span>
                        <span className="text-slate-500">
                          {charge.amountLabel} · {charge.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
