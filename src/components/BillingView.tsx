"use client";

import { useCallback, useEffect, useState } from "react";

type PendingItem = { id: string; procedure: string; priceLabel: string };
type PendingGroup = {
  patientId: string;
  patientName: string;
  company: string | null;
  total: number;
  totalLabel: string;
  items: PendingItem[];
};
type Invoice = {
  id: string;
  patientName: string;
  company: string | null;
  totalLabel: string;
  status: string;
  itemsCount: number;
  createdAt: string;
};

export default function BillingView() {
  const [pending, setPending] = useState<PendingGroup[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/interno/billing");
    const data = await res.json();
    setPending(data.pending ?? []);
    setInvoices(data.invoices ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/interno/billing");
      const data = await res.json();
      if (!active) return;
      setPending(data.pending ?? []);
      setInvoices(data.invoices ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function generateInvoice(patientId: string, name: string) {
    setBusy(patientId);
    setMsg(null);
    try {
      const res = await fetch("/api/interno/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao gerar fatura");
      else setMsg(`Fatura gerada para ${name}: ${data.invoice.totalLabel}`);
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <p className="text-slate-500">Carregando faturamento...</p>;

  return (
    <div className="space-y-8">
      {msg && (
        <p className="rounded-lg bg-indigo-50 px-4 py-2 text-sm text-indigo-800">{msg}</p>
      )}

      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          Procedimentos a faturar (Pay Per Use)
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Itens utilizados e ainda não faturados, agrupados por beneficiário.
        </p>

        {pending.length === 0 && (
          <p className="mt-4 rounded-lg bg-white p-4 text-slate-500">
            Nenhum procedimento pendente de faturamento.
          </p>
        )}

        <div className="mt-4 space-y-4">
          {pending.map((g) => (
            <div
              key={g.patientId}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{g.patientName}</p>
                  <p className="text-sm text-slate-500">{g.company ?? "Particular"}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-indigo-700">{g.totalLabel}</span>
                  <button
                    onClick={() => generateInvoice(g.patientId, g.patientName)}
                    disabled={busy === g.patientId}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                  >
                    {busy === g.patientId ? "Gerando..." : "Gerar fatura"}
                  </button>
                </div>
              </div>
              <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
                {g.items.map((it) => (
                  <li key={it.id} className="flex justify-between py-2 text-sm">
                    <span className="text-slate-700">{it.procedure}</span>
                    <span className="text-slate-500">{it.priceLabel}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Faturas emitidas</h2>
        {invoices.length === 0 && (
          <p className="mt-4 rounded-lg bg-white p-4 text-slate-500">
            Nenhuma fatura emitida ainda.
          </p>
        )}
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Beneficiário</th>
                <th className="px-4 py-2 font-medium">Empresa</th>
                <th className="px-4 py-2 font-medium">Itens</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-2 text-slate-800">{inv.patientName}</td>
                  <td className="px-4 py-2 text-slate-500">{inv.company ?? "Particular"}</td>
                  <td className="px-4 py-2 text-slate-500">{inv.itemsCount}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-slate-900">
                    {inv.totalLabel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
