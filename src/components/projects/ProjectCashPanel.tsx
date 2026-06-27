"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";
import { CASH_CATEGORIES, CASH_ENTRY_TYPES } from "@/lib/project/construction-modules";

type CashEntry = {
  id: string;
  type: string;
  typeLabel: string;
  category: string;
  categoryLabel: string;
  description: string;
  amount: number;
  isPlanned: boolean;
  entryDate: string;
};

type Summary = {
  plannedIncome: number;
  plannedExpense: number;
  actualIncome: number;
  actualExpense: number;
  balancePlanned: number;
  balanceActual: number;
  variance: number;
};

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProjectCashPanel({ projectId }: { projectId: string }) {
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "ENTRADA",
    category: "CONTRATO",
    description: "",
    amount: 0,
    isPlanned: true,
    entryDate: new Date().toISOString().slice(0, 10),
  });

  const load = useCallback(async () => {
    const res = await fetch(`/api/interno/projects/${projectId}/cash`);
    const json = await res.json();
    if (res.ok) {
      setEntries(json.entries as CashEntry[]);
      setSummary(json.summary as Summary);
    }
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
    const res = await fetch(`/api/interno/projects/${projectId}/cash`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg(json.error ?? "Erro ao salvar");
      return;
    }
    setMsg("Lançamento registrado");
    setForm((f) => ({ ...f, description: "", amount: 0 }));
    await load();
  }

  if (loading) return <LoadingState message="Carregando caixa da obra…" />;

  return (
    <div className="space-y-4">
      {msg && <Alert tone="info">{msg}</Alert>}
      {summary && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--border-default)] p-4">
            <p className="text-xs uppercase text-[var(--text-muted)]">Orçado (saldo)</p>
            <p className="mt-1 text-lg font-semibold">{brl(summary.balancePlanned)}</p>
          </div>
          <div className="rounded-xl border border-[var(--border-default)] p-4">
            <p className="text-xs uppercase text-[var(--text-muted)]">Realizado (saldo)</p>
            <p className="mt-1 text-lg font-semibold">{brl(summary.balanceActual)}</p>
          </div>
          <div className="rounded-xl border border-[var(--border-default)] p-4">
            <p className="text-xs uppercase text-[var(--text-muted)]">Variação</p>
            <p className="mt-1 text-lg font-semibold">{brl(summary.variance)}</p>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="grid gap-3 rounded-xl border border-[var(--border-default)] p-4 sm:grid-cols-2">
        <label className="text-sm">
          Tipo
          <select
            className="mt-1 w-full rounded-md border px-2 py-1.5"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {CASH_ENTRY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Categoria
          <select
            className="mt-1 w-full rounded-md border px-2 py-1.5"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {CASH_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          Descrição
          <input
            className="mt-1 w-full rounded-md border px-2 py-1.5"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </label>
        <label className="text-sm">
          Valor (R$)
          <input
            type="number"
            min={0}
            step={0.01}
            className="mt-1 w-full rounded-md border px-2 py-1.5"
            value={form.amount || ""}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            required
          />
        </label>
        <label className="text-sm">
          Data
          <input
            type="date"
            className="mt-1 w-full rounded-md border px-2 py-1.5"
            value={form.entryDate}
            onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
          />
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={form.isPlanned}
            onChange={(e) => setForm({ ...form, isPlanned: e.target.checked })}
          />
          Orçado (desmarcado = realizado)
        </label>
        <button
          type="submit"
          className="rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white sm:col-span-2"
        >
          Adicionar lançamento
        </button>
      </form>

      <ul className="divide-y rounded-xl border border-[var(--border-default)]">
        {entries.length === 0 ? (
          <li className="p-4 text-sm text-[var(--text-muted)]">Nenhum lançamento ainda.</li>
        ) : (
          entries.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
              <div>
                <p className="font-medium">{e.description}</p>
                <p className="text-[var(--text-muted)]">
                  {e.typeLabel} · {e.categoryLabel} · {e.isPlanned ? "Orçado" : "Realizado"}
                </p>
              </div>
              <span className={e.type === "ENTRADA" ? "text-emerald-600" : "text-red-600"}>
                {e.type === "ENTRADA" ? "+" : "−"}{brl(e.amount)}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
