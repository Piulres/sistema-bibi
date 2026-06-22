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
import StatCard from "@/components/ui/StatCard";

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

type PixState = {
  invoiceId: string;
  paymentId: string;
  pixCopyPaste: string;
};

export default function BillingView() {
  const [pending, setPending] = useState<PendingGroup[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pixState, setPixState] = useState<PixState | null>(null);
  const [gatewayConfigured, setGatewayConfigured] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/interno/billing");
    const data = await res.json();
    setPending(data.pending ?? []);
    setInvoices(data.invoices ?? []);
    setGatewayConfigured(Boolean(data.paymentGatewayConfigured));
    setLoading(false);
  }, []);

  const [permissionError, setPermissionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/interno/billing");
      const data = await res.json();
      if (!active) return;
      if (res.status === 403) {
        setPermissionError(data.error ?? "Sem permissão para acessar o faturamento");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setPermissionError(data.error ?? "Erro ao carregar faturamento");
        setLoading(false);
        return;
      }
      setPending(data.pending ?? []);
      setInvoices(data.invoices ?? []);
      setGatewayConfigured(Boolean(data.paymentGatewayConfigured));
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

  async function markPaid(invoiceId: string) {
    setBusy(`pay-${invoiceId}`);
    setMsg(null);
    try {
      const res = await fetch(`/api/interno/invoices/${invoiceId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "MANUAL" }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao marcar como paga");
      else {
        setMsg("Fatura marcada como paga");
        setPixState(null);
        await load();
      }
    } finally {
      setBusy(null);
    }
  }

  async function generatePix(invoiceId: string) {
    setBusy(`pix-${invoiceId}`);
    setMsg(null);
    try {
      const res = await fetch(`/api/interno/invoices/${invoiceId}/pix`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao gerar PIX");
      else {
        setPixState({
          invoiceId,
          paymentId: data.payment.id,
          pixCopyPaste: data.pixCopyPaste ?? data.payment.pixCopyPaste,
        });
        setMsg("Cobrança PIX gerada — copie o código ou confirme o pagamento");
      }
    } finally {
      setBusy(null);
    }
  }

  async function confirmPix(invoiceId: string, paymentId: string) {
    setBusy(`confirm-${invoiceId}`);
    setMsg(null);
    try {
      const res = await fetch(`/api/interno/invoices/${invoiceId}/confirm-pix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao confirmar PIX");
      else {
        setMsg("Pagamento PIX confirmado");
        setPixState(null);
        await load();
      }
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <LoadingState message="Carregando faturamento..." />;
  if (permissionError) return <Alert tone="danger">{permissionError}</Alert>;

  return (
    <div className="space-y-8">
      {msg && <Alert tone="info">{msg}</Alert>}

      {pixState && (
        <Alert tone="info">
          <p className="font-medium">PIX gerado</p>
          <p className="mt-2 break-all font-mono text-xs">{pixState.pixCopyPaste}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="portal"
              size="sm"
              disabled={busy === `confirm-${pixState.invoiceId}`}
              onClick={() => confirmPix(pixState.invoiceId, pixState.paymentId)}
            >
              {busy === `confirm-${pixState.invoiceId}` ? "Confirmando..." : "Confirmar pagamento PIX"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPixState(null)}>
              Fechar
            </Button>
          </div>
        </Alert>
      )}

      {!gatewayConfigured && (
        <Alert tone="warning">
          Gateway de pagamento não configurado. Defina PAYMENT_GATEWAY=mock no .env para habilitar PIX.
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Beneficiários com pendência"
          value={pending.length}
          tone="warning"
          hint="Aguardando geração de fatura"
        />
        <StatCard
          label="Faturas emitidas"
          value={invoices.length}
          tone="accent"
        />
        <StatCard
          label="Faturas em aberto"
          value={invoices.filter((i) => i.status !== "PAGA").length}
          hint="Inclui FECHADA aguardando pagamento"
        />
      </div>

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
                <th className="px-4 py-2 text-right font-medium">TISS</th>
                <th className="px-4 py-2 text-right font-medium">Ações</th>
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
                  <td className="px-4 py-2 text-right">
                    <a
                      href={`/api/interno/invoices/${inv.id}/tiss`}
                      download
                      className="text-sm font-medium text-[var(--portal-accent)] hover:underline"
                    >
                      XML
                    </a>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {inv.status !== "PAGA" && (
                      <div className="flex flex-wrap justify-end gap-2">
                        {gatewayConfigured && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={busy === `pix-${inv.id}`}
                            onClick={() => generatePix(inv.id)}
                          >
                            {busy === `pix-${inv.id}` ? "..." : "PIX"}
                          </Button>
                        )}
                        <Button
                          variant="portal"
                          size="sm"
                          disabled={busy === `pay-${inv.id}`}
                          onClick={() => markPaid(inv.id)}
                        >
                          {busy === `pay-${inv.id}` ? "..." : "Marcar paga"}
                        </Button>
                      </div>
                    )}
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
