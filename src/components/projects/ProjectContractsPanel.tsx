"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";

type Contract = {
  id: string;
  contractNumber: string;
  title: string;
  totalValue: number;
  consolidatedValue: number;
  statusLabel: string;
  addendums: { addendumNumber: number; title: string; valueDelta: number; statusLabel: string }[];
};

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProjectContractsPanel({ projectId }: { projectId: string }) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ contractNumber: "", title: "", totalValue: 0 });

  const load = useCallback(async () => {
    const res = await fetch(`/api/interno/projects/${projectId}/contracts`);
    const json = await res.json();
    if (res.ok) setContracts(json.contracts as Contract[]);
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
    const res = await fetch(`/api/interno/projects/${projectId}/contracts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg(json.error ?? "Erro");
      return;
    }
    setMsg("Contrato criado");
    await load();
  }

  async function addAddendum(contractId: string) {
    const title = prompt("Título do aditivo:");
    if (!title) return;
    const valueDelta = Number(prompt("Valor adicional (R$):", "0") ?? 0);
    const res = await fetch(`/api/interno/projects/${projectId}/contracts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "addendum",
        contractId,
        addendumNumber: (contracts.find((c) => c.id === contractId)?.addendums.length ?? 0) + 1,
        title,
        valueDelta,
        status: "APROVADO",
      }),
    });
    if (res.ok) {
      setMsg("Aditivo registrado");
      await load();
    }
  }

  if (loading) return <LoadingState message="Carregando contratos…" />;

  return (
    <div className="space-y-4">
      {msg && <Alert tone="info">{msg}</Alert>}
      <form onSubmit={submit} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-3">
        <input className="rounded-md border px-2 py-1.5 text-sm" placeholder="Nº contrato" value={form.contractNumber} onChange={(e) => setForm({ ...form, contractNumber: e.target.value })} required />
        <input className="rounded-md border px-2 py-1.5 text-sm sm:col-span-2" placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input type="number" className="rounded-md border px-2 py-1.5 text-sm" placeholder="Valor" value={form.totalValue || ""} onChange={(e) => setForm({ ...form, totalValue: Number(e.target.value) })} />
        <button type="submit" className="rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm text-white sm:col-span-2">Novo contrato</button>
      </form>
      {contracts.map((c) => (
        <article key={c.id} className="rounded-xl border p-4">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <h4 className="font-medium">{c.contractNumber} — {c.title}</h4>
              <p className="text-sm text-[var(--text-muted)]">{c.statusLabel}</p>
            </div>
            <div className="text-right text-sm">
              <p>Base {brl(c.totalValue)}</p>
              <p className="font-medium">Consolidado {brl(c.consolidatedValue)}</p>
            </div>
          </div>
          {c.addendums.length > 0 && (
            <ul className="mt-3 border-t pt-3 text-sm">
              {c.addendums.map((a) => (
                <li key={a.addendumNumber} className="flex justify-between">
                  <span>Aditivo {a.addendumNumber}: {a.title}</span>
                  <span>{brl(a.valueDelta)} · {a.statusLabel}</span>
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={() => addAddendum(c.id)} className="mt-3 text-sm text-[var(--brand-accent)]">
            + Aditivo
          </button>
        </article>
      ))}
    </div>
  );
}
