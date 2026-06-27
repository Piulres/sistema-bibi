"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";
import { PIPELINE_STATUSES } from "@/lib/project/construction-modules";

type Entry = {
  id: string;
  contactName: string;
  projectName: string | null;
  estimatedValue: number;
  statusLabel: string;
  probability: number;
  weightedValue: number;
};

type PipelineData = {
  columns: { status: string; statusLabel: string; entries: Entry[]; totalValue: number }[];
  totalPipeline: number;
  weightedPipeline: number;
};

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ConstructionPipelineView() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    contactName: "",
    projectName: "",
    estimatedValue: 0,
    status: "LEAD",
    probability: 20,
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/interno/construction/pipeline");
    const json = await res.json();
    if (res.ok) setData(json as PipelineData);
    setLoading(false);
  }, []);

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
    const res = await fetch("/api/interno/construction/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMsg("Lead adicionado ao pipeline");
      await load();
    }
  }

  if (loading) return <LoadingState message="Carregando pipeline comercial…" />;

  return (
    <div className="space-y-6">
      {msg && <Alert tone="info">{msg}</Alert>}
      {data && (
        <div className="flex flex-wrap gap-4 text-sm">
          <span>Pipeline total: <strong>{brl(data.totalPipeline)}</strong></span>
          <span>Ponderado: <strong>{brl(data.weightedPipeline)}</strong></span>
        </div>
      )}
      <form onSubmit={submit} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input className="rounded-md border px-2 py-1.5 text-sm" placeholder="Contato" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} required />
        <input className="rounded-md border px-2 py-1.5 text-sm" placeholder="Obra prevista" value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} />
        <input type="number" className="rounded-md border px-2 py-1.5 text-sm" placeholder="Valor estimado" value={form.estimatedValue || ""} onChange={(e) => setForm({ ...form, estimatedValue: Number(e.target.value) })} />
        <select className="rounded-md border px-2 py-1.5 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          {PIPELINE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm text-white">Adicionar</button>
      </form>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {data?.columns.map((col) => (
          <div key={col.status} className="min-w-[220px] flex-shrink-0 rounded-xl border bg-[var(--surface-muted)]/40 p-3">
            <h3 className="text-sm font-semibold">{col.statusLabel}</h3>
            <p className="text-xs text-[var(--text-muted)]">{brl(col.totalValue)}</p>
            <ul className="mt-2 space-y-2">
              {col.entries.map((e) => (
                <li key={e.id} className="rounded-lg border bg-[var(--surface-card)] p-2 text-xs">
                  <p className="font-medium">{e.contactName}</p>
                  <p className="text-[var(--text-muted)]">{e.projectName ?? "—"}</p>
                  <p>{brl(e.estimatedValue)} · {e.probability}%</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
