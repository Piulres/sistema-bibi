"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";
import { ALLOCATION_CONTRACT_TYPES, PAYMENT_TYPES } from "@/lib/project/construction-modules";

type Provider = { id: string; name: string; email: string };

type Allocation = {
  id: string;
  providerId: string;
  providerName: string;
  trade: string;
  contractTypeLabel: string;
  contractValue: number;
  dailyRate: number | null;
  paidTotal: number;
  advanceTotal: number;
  remaining: number;
};

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProjectAllocationsPanel({ projectId }: { projectId: string }) {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    providerId: "",
    trade: "",
    contractType: "DIARIA",
    contractValue: 0,
    dailyRate: 0,
  });
  const [paymentForm, setPaymentForm] = useState({
    allocationId: "",
    amount: 0,
    paymentType: "PAGAMENTO",
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const load = useCallback(async () => {
    const [allocRes, metaRes] = await Promise.all([
      fetch(`/api/interno/projects/${projectId}/allocations`),
      fetch("/api/interno/projects/meta"),
    ]);
    const allocJson = await allocRes.json();
    const metaJson = await metaRes.json();
    if (allocRes.ok) setAllocations(allocJson.allocations as Allocation[]);
    if (metaRes.ok) setProviders(metaJson.providers as Provider[]);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    let active = true;
    (async () => {
      await load();
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch(`/api/interno/projects/${projectId}/allocations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg(json.error ?? "Erro");
      return;
    }
    setMsg("Prestador vinculado à obra");
    setForm({ providerId: "", trade: "", contractType: "DIARIA", contractValue: 0, dailyRate: 0 });
    await load();
  }

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch(`/api/interno/projects/${projectId}/allocations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "payment",
        allocationId: paymentForm.allocationId,
        amount: paymentForm.amount,
        paymentType: paymentForm.paymentType,
        paymentDate: paymentForm.paymentDate,
        notes: paymentForm.notes || null,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg(json.error ?? "Erro ao registrar pagamento");
      return;
    }
    setMsg("Pagamento registrado no caixa da obra");
    setPaymentForm((f) => ({ ...f, amount: 0, notes: "" }));
    await load();
  }

  if (loading) return <LoadingState message="Carregando equipe…" />;

  return (
    <div className="space-y-4">
      {msg && <Alert tone="info">{msg}</Alert>}
      <form onSubmit={submit} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2">
          Prestador
          <select
            className="mt-1 w-full rounded-md border px-2 py-1.5"
            value={form.providerId}
            onChange={(e) => setForm({ ...form, providerId: e.target.value })}
            required
          >
            <option value="">Selecione…</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.email})
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Ofício
          <input
            className="mt-1 w-full rounded-md border px-2 py-1.5"
            value={form.trade}
            onChange={(e) => setForm({ ...form, trade: e.target.value })}
            required
          />
        </label>
        <label className="text-sm">
          Tipo contrato
          <select
            className="mt-1 w-full rounded-md border px-2 py-1.5"
            value={form.contractType}
            onChange={(e) => setForm({ ...form, contractType: e.target.value })}
          >
            {ALLOCATION_CONTRACT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Valor contrato
          <input
            type="number"
            className="mt-1 w-full rounded-md border px-2 py-1.5"
            value={form.contractValue || ""}
            onChange={(e) => setForm({ ...form, contractValue: Number(e.target.value) })}
          />
        </label>
        <label className="text-sm">
          Diária (R$)
          <input
            type="number"
            className="mt-1 w-full rounded-md border px-2 py-1.5"
            value={form.dailyRate || ""}
            onChange={(e) => setForm({ ...form, dailyRate: Number(e.target.value) })}
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm text-white sm:col-span-2"
        >
          Vincular prestador
        </button>
      </form>

      {allocations.length > 0 && (
        <form onSubmit={submitPayment} className="grid gap-3 rounded-xl border border-dashed p-4 sm:grid-cols-2">
          <h4 className="text-sm font-medium sm:col-span-2">Registrar pagamento / adiantamento</h4>
          <label className="text-sm sm:col-span-2">
            Prestador
            <select
              className="mt-1 w-full rounded-md border px-2 py-1.5"
              value={paymentForm.allocationId}
              onChange={(e) => setPaymentForm({ ...paymentForm, allocationId: e.target.value })}
              required
            >
              <option value="">Selecione…</option>
              {allocations.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.providerName} — {a.trade}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Valor (R$)
            <input
              type="number"
              min={0}
              step={0.01}
              className="mt-1 w-full rounded-md border px-2 py-1.5"
              value={paymentForm.amount || ""}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
              required
            />
          </label>
          <label className="text-sm">
            Tipo
            <select
              className="mt-1 w-full rounded-md border px-2 py-1.5"
              value={paymentForm.paymentType}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentType: e.target.value })}
            >
              {PAYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Data
            <input
              type="date"
              className="mt-1 w-full rounded-md border px-2 py-1.5"
              value={paymentForm.paymentDate}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
              required
            />
          </label>
          <label className="text-sm">
            Observações
            <input
              className="mt-1 w-full rounded-md border px-2 py-1.5"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
            />
          </label>
          <button
            type="submit"
            className="rounded-md border px-4 py-2 text-sm sm:col-span-2 hover:bg-[var(--surface-muted)]"
          >
            Registrar pagamento
          </button>
        </form>
      )}

      <ul className="divide-y rounded-xl border">
        {allocations.map((a) => (
          <li key={a.id} className="p-4 text-sm">
            <p className="font-medium">
              {a.providerName} — {a.trade}
            </p>
            <p className="text-[var(--text-muted)]">
              {a.contractTypeLabel} · Contrato {brl(a.contractValue)}
              {a.dailyRate != null ? ` · Diária ${brl(a.dailyRate)}` : ""}
            </p>
            <p className="mt-1">
              Pago {brl(a.paidTotal)} · Adiant. {brl(a.advanceTotal)} · Restante {brl(a.remaining)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
