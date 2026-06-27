"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";
import { ALLOCATION_CONTRACT_TYPES } from "@/lib/project/construction-modules";

type Allocation = {
  id: string;
  providerName: string;
  trade: string;
  contractTypeLabel: string;
  contractValue: number;
  paidTotal: number;
  advanceTotal: number;
  remaining: number;
};

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProjectAllocationsPanel({ projectId }: { projectId: string }) {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    providerId: "",
    trade: "",
    contractType: "DIARIA",
    contractValue: 0,
    dailyRate: 0,
  });

  const load = useCallback(async () => {
    const res = await fetch(`/api/interno/projects/${projectId}/allocations`);
    const json = await res.json();
    if (res.ok) setAllocations(json.allocations as Allocation[]);
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
    await load();
  }

  if (loading) return <LoadingState message="Carregando equipe…" />;

  return (
    <div className="space-y-4">
      {msg && <Alert tone="info">{msg}</Alert>}
      <form onSubmit={submit} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2">
          ID do prestador (usuário PRESTADOR)
          <input
            className="mt-1 w-full rounded-md border px-2 py-1.5"
            value={form.providerId}
            onChange={(e) => setForm({ ...form, providerId: e.target.value })}
            placeholder="cuid do prestador"
            required
          />
        </label>
        <label className="text-sm">
          Ofício
          <input className="mt-1 w-full rounded-md border px-2 py-1.5" value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })} required />
        </label>
        <label className="text-sm">
          Tipo contrato
          <select className="mt-1 w-full rounded-md border px-2 py-1.5" value={form.contractType} onChange={(e) => setForm({ ...form, contractType: e.target.value })}>
            {ALLOCATION_CONTRACT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Valor contrato
          <input type="number" className="mt-1 w-full rounded-md border px-2 py-1.5" value={form.contractValue || ""} onChange={(e) => setForm({ ...form, contractValue: Number(e.target.value) })} />
        </label>
        <label className="text-sm">
          Diária (R$)
          <input type="number" className="mt-1 w-full rounded-md border px-2 py-1.5" value={form.dailyRate || ""} onChange={(e) => setForm({ ...form, dailyRate: Number(e.target.value) })} />
        </label>
        <button type="submit" className="rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm text-white sm:col-span-2">Vincular prestador</button>
      </form>
      <ul className="divide-y rounded-xl border">
        {allocations.map((a) => (
          <li key={a.id} className="p-4 text-sm">
            <p className="font-medium">{a.providerName} — {a.trade}</p>
            <p className="text-[var(--text-muted)]">{a.contractTypeLabel} · Contrato {brl(a.contractValue)}</p>
            <p className="mt-1">Pago {brl(a.paidTotal)} · Adiant. {brl(a.advanceTotal)} · Restante {brl(a.remaining)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
