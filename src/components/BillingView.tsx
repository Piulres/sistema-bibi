"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import StatCard from "@/components/ui/StatCard";
import ExportButtons from "@/components/ExportButtons";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { fetchJson } from "@/lib/ui/api-feedback";
import { confirmPresets } from "@/lib/ui/confirm-presets";

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

type BillingPayload = {
  pending?: PendingGroup[];
  invoices?: Invoice[];
  paymentGatewayConfigured?: boolean;
};

type PixState = {
  invoiceId: string;
  paymentId: string;
  pixCopyPaste: string;
  totalLabel: string;
};

export default function BillingView() {
  const { isBusy, run, showToast } = useAsyncAction();
  const [pixState, setPixState] = useState<PixState | null>(null);

  const loadBilling = useCallback(
    () =>
      fetchJson<BillingPayload>("/api/interno/billing", undefined, "Erro ao carregar faturamento"),
    [],
  );

  const { data, loading, error, reload } = useAsyncData(loadBilling, [], {
    forbiddenMessage: "Sem permissão para acessar o faturamento",
  });

  const pending = data?.pending ?? [];
  const invoices = data?.invoices ?? [];
  const gatewayConfigured = Boolean(data?.paymentGatewayConfigured);

  async function generateInvoice(patientId: string, name: string) {
    await run(
      patientId,
      () =>
        fetch("/api/interno/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId }),
        }),
      {
        successMessage: `Fatura gerada para ${name}`,
        onSuccess: async (body) => {
          const invoice = body.invoice as { totalLabel?: string } | undefined;
          if (invoice?.totalLabel) {
            showToast({
              message: `Total: ${invoice.totalLabel}`,
              tone: "info",
            });
          }
          await reload();
        },
      },
    );
  }

  async function markPaid(invoiceId: string, totalLabel: string) {
    await run(
      `pay-${invoiceId}`,
      () =>
        fetch(`/api/interno/invoices/${invoiceId}/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: "MANUAL" }),
        }),
      {
        confirm: confirmPresets.markPaid(totalLabel),
        successMessage: "Fatura marcada como paga",
        onSuccess: async () => {
          setPixState(null);
          await reload();
        },
      },
    );
  }

  async function generatePix(invoiceId: string, totalLabel: string) {
    await run(
      `pix-${invoiceId}`,
      () => fetch(`/api/interno/invoices/${invoiceId}/pix`, { method: "POST" }),
      {
        silentSuccess: true,
        onSuccess: (body) => {
          const payment = body.payment as { id: string; pixCopyPaste?: string };
          setPixState({
            invoiceId,
            paymentId: payment.id,
            pixCopyPaste: String(body.pixCopyPaste ?? payment.pixCopyPaste ?? ""),
            totalLabel,
          });
          showToast({
            message: "Cobrança PIX gerada — copie o código ou confirme o pagamento",
            tone: "success",
          });
        },
      },
    );
  }

  async function confirmPix(invoiceId: string, paymentId: string, totalLabel: string) {
    await run(
      `confirm-${invoiceId}`,
      () =>
        fetch(`/api/interno/invoices/${invoiceId}/confirm-pix`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId }),
        }),
      {
        confirm: confirmPresets.confirmPix(totalLabel),
        successMessage: "Pagamento PIX confirmado",
        onSuccess: async () => {
          setPixState(null);
          await reload();
        },
      },
    );
  }

  return (
    <ViewStateBoundary
      loading={loading}
      error={error}
      loadingMessage="Carregando faturamento..."
      onRetry={() => void reload()}
    >
      <div className="space-y-8">
        {pixState && (
          <Alert tone="info">
            <p className="font-medium">PIX gerado — {pixState.totalLabel}</p>
            <p className="mt-2 break-all font-mono text-xs">{pixState.pixCopyPaste}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="portal"
                size="sm"
                disabled={isBusy(`confirm-${pixState.invoiceId}`)}
                onClick={() =>
                  confirmPix(pixState.invoiceId, pixState.paymentId, pixState.totalLabel)
                }
              >
                {isBusy(`confirm-${pixState.invoiceId}`)
                  ? "Confirmando..."
                  : "Confirmar pagamento PIX"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setPixState(null)}>
                Fechar
              </Button>
            </div>
          </Alert>
        )}

        {!gatewayConfigured && (
          <Alert tone="warning">
            Gateway de pagamento não configurado. Defina PAYMENT_GATEWAY=mock no .env para habilitar
            PIX.
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Beneficiários com pendência"
            value={pending.length}
            tone="warning"
            hint="Aguardando geração de fatura"
          />
          <StatCard label="Faturas emitidas" value={invoices.length} tone="accent" />
          <StatCard
            label="Faturas em aberto"
            value={invoices.filter((i) => i.status !== "PAGA").length}
            hint="Inclui FECHADA aguardando pagamento"
          />
        </div>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeader
              title="Procedimentos a faturar (Pay Per Use)"
              description="Itens utilizados e ainda não faturados, agrupados por beneficiário."
            />
            <ExportButtons baseUrl="/api/interno/billing/export" />
          </div>

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
                      disabled={isBusy(g.patientId)}
                    >
                      {isBusy(g.patientId) ? "Gerando..." : "Gerar fatura"}
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
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeader title="Faturas emitidas" />
            <ExportButtons baseUrl="/api/interno/billing/export" />
          </div>
          {invoices.length === 0 && <EmptyState message="Nenhuma fatura emitida ainda." />}
          <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[var(--shadow-card)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-2 font-medium">Beneficiário</th>
                  <th className="px-4 py-2 font-medium">Empresa</th>
                  <th className="px-4 py-2 font-medium">Itens</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Total</th>
                  <th className="px-4 py-2 text-right font-medium">Exportar</th>
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
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <ExportButtons
                          baseUrl={`/api/interno/invoices/${inv.id}/export`}
                          formats={["pdf", "xlsx"]}
                        />
                        <a
                          href={`/api/interno/invoices/${inv.id}/tiss`}
                          download
                          className="text-sm font-medium text-[var(--portal-accent)] hover:underline"
                        >
                          XML
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {inv.status !== "PAGA" && (
                        <div className="flex flex-wrap justify-end gap-2">
                          {gatewayConfigured && (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={isBusy(`pix-${inv.id}`)}
                              onClick={() => generatePix(inv.id, inv.totalLabel)}
                            >
                              {isBusy(`pix-${inv.id}`) ? "..." : "PIX"}
                            </Button>
                          )}
                          <Button
                            variant="portal"
                            size="sm"
                            disabled={isBusy(`pay-${inv.id}`)}
                            onClick={() => markPaid(inv.id, inv.totalLabel)}
                          >
                            {isBusy(`pay-${inv.id}`) ? "..." : "Marcar paga"}
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
    </ViewStateBoundary>
  );
}
