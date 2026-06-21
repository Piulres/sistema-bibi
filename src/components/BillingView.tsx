"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";

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
  patientId: string;
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

  if (loading) return <LoadingState message="Carregando faturamento..." />;

  return (
    <div className="space-y-8">
      {msg && <Alert tone="info">{msg}</Alert>}

      <section>
        <SectionHeader
          title="Procedimentos a faturar (Pay Per Use)"
          description="Itens utilizados e ainda não faturados, agrupados por beneficiário."
        />

        {pending.length === 0 && (
          <EmptyState message="Nenhum procedimento pendente de faturamento." />
        )}

        <div className="mt-4 space-y-4">
          {pending.map((g) => (
            <Card key={g.patientId}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link
                    href={`/interno/beneficiarios/${g.patientId}?from=/interno`}
                    className="font-semibold text-[var(--portal-accent)] hover:underline"
                  >
                    {g.patientName}
                  </Link>
                  <p className="text-sm text-[var(--text-muted)]">{g.company ?? "Particular"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={`/interno/beneficiarios/${g.patientId}?from=/interno`}>
                    <Button variant="secondary" size="sm">
                      Cliente 360°
                    </Button>
                  </Link>
                  <span className="text-lg font-bold text-[var(--portal-accent)]">
                    {g.totalLabel}
                  </span>
                  <Button
                    variant="portal"
                    size="sm"
                    onClick={() => generateInvoice(g.patientId, g.patientName)}
                    disabled={busy === g.patientId}
                  >
                    {busy === g.patientId ? "Gerando..." : "Gerar fatura"}
                  </Button>
                </div>
              </div>
              <ul className="mt-3 divide-y divide-[var(--border-default)] border-t border-[var(--border-default)]">
                {g.items.map((it) => (
                  <li key={it.id} className="flex justify-between py-2 text-sm">
                    <span className="text-[var(--text-secondary)]">{it.procedure}</span>
                    <span className="text-[var(--text-muted)]">{it.priceLabel}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Faturas emitidas" />
        {invoices.length === 0 && (
          <EmptyState message="Nenhuma fatura emitida ainda." />
        )}
        <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[var(--shadow-card)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-2 font-medium">Beneficiário</th>
                <th className="px-4 py-2 font-medium">Empresa</th>
                <th className="px-4 py-2 font-medium">Itens</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-2">
                    <Link
                      href={`/interno/beneficiarios/${inv.patientId}?from=/interno`}
                      className="font-medium text-[var(--portal-accent)] hover:underline"
                    >
                      {inv.patientName}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-[var(--text-muted)]">
                    {inv.company ?? "Particular"}
                  </td>
                  <td className="px-4 py-2 text-[var(--text-muted)]">{inv.itemsCount}</td>
                  <td className="px-4 py-2">
                    <StatusBadge value={inv.status} map="invoice" />
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-[var(--text-primary)]">
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
