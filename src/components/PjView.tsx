"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import SectionHeader from "@/components/ui/SectionHeader";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

type AlertItem = {
  tone: "warning" | "danger" | "info";
  message: string;
  href?: string;
  actionLabel?: string;
};

type Overview = {
  company: {
    name: string;
    cnpj: string;
    status: string;
    contractActive: boolean;
    beneficiariesCount: number;
    totalConsumedLabel: string;
    pendingInvoicesLabel: string;
    mrrLabel: string;
  };
  alerts: AlertItem[];
  beneficiaries: {
    id: string;
    name: string;
    cpf: string;
    usageCount: number;
    consumedLabel: string;
    pendingLabel: string;
  }[];
  invoices: {
    id: string;
    patientName: string;
    totalLabel: string;
    status: string;
    createdAtLabel: string;
  }[];
  subscriptions: {
    id: string;
    patientName: string;
    status: string;
    statusLabel: string;
    billingCycleLabel: string;
    amountLabel: string;
    pendingCharges: number;
  }[];
  summary: {
    openInvoicesCount: number;
    openInvoicesTotalLabel: string;
    activeSubscriptions: number;
  };
};

const alertTone = {
  warning: "warning" as const,
  danger: "danger" as const,
  info: "info" as const,
};

export default function PjView() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/pj/overview");
        const d = await res.json();
        if (!active) return;
        if (!res.ok) setError(d.error ?? "Falha ao carregar dados da empresa");
        else setData(d);
      } catch {
        if (active) setError("Falha ao carregar dados da empresa");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (error) return <Alert tone="danger">{error}</Alert>;
  if (!data) return <LoadingState message="Carregando dados da empresa..." />;

  const { company, alerts, beneficiaries, invoices, subscriptions, summary } = data;

  return (
    <div className="space-y-8">
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <Alert key={i} tone={alertTone[a.tone]}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>{a.message}</span>
                {a.href && a.actionLabel && (
                  <a
                    href={a.href}
                    className="inline-flex items-center rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                  >
                    {a.actionLabel}
                  </a>
                )}
              </div>
            </Alert>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--text-muted)]">
          MRR estimado: <strong className="text-[var(--text-primary)]">{company.mrrLabel}</strong>
          {" · "}
          Faturas em aberto: {company.pendingInvoicesLabel}
        </p>
        <a href="/api/pj/reports" download>
          <Button variant="secondary" size="sm">
            Exportar relatório CSV
          </Button>
        </a>
      </div>

      <section id="resumo">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Contrato"
          value={<StatusBadge value={company.status} map="company" />}
          hint={`${company.contractActive ? "Operacional" : "Inoperante"} · CNPJ ${company.cnpj}`}
          info="Status do contrato B2B com a clínica operadora."
        />
        <StatCard
          label="Beneficiários"
          value={company.beneficiariesCount}
          info="Colaboradores vinculados ao plano corporativo da empresa."
        />
        <StatCard
          label="Consumo Pay Per Use"
          value={company.totalConsumedLabel}
          tone="accent"
          info="Soma dos procedimentos utilizados pelos beneficiários no modelo por uso."
        />
        <StatCard
          label="Faturas em aberto"
          value={summary.openInvoicesTotalLabel}
          hint={`${summary.openInvoicesCount} fatura(s) · ${summary.activeSubscriptions} assinatura(s)`}
          tone={summary.openInvoicesCount > 0 ? "warning" : "default"}
          info="Valor total de faturas ainda não pagas pela empresa."
        />
      </div>
      </section>

      <section id="beneficiarios">
        <SectionHeader title="Beneficiários" />
        <div className="mt-4 overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[var(--shadow-card)]">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">CPF</th>
                <th className="px-4 py-2 font-medium">Procedimentos</th>
                <th className="px-4 py-2 text-right font-medium">Consumo</th>
                <th className="px-4 py-2 text-right font-medium">Pendente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {beneficiaries.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-2 text-[var(--text-secondary)]">{b.name}</td>
                  <td className="px-4 py-2 text-[var(--text-muted)]">{b.cpf}</td>
                  <td className="px-4 py-2 text-[var(--text-muted)]">{b.usageCount}</td>
                  <td className="px-4 py-2 text-right font-semibold text-[var(--text-primary)]">
                    {b.consumedLabel}
                  </td>
                  <td className="px-4 py-2 text-right text-[var(--text-muted)]">{b.pendingLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="assinaturas">
        <SectionHeader title="Assinaturas recorrentes" />
        {subscriptions.length === 0 ? (
          <EmptyState message="Nenhuma assinatura vinculada à empresa." />
        ) : (
          <ul className="mt-4 space-y-2">
            {subscriptions.map((sub) => (
              <Card key={sub.id} padding="sm" className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{sub.patientName}</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {sub.billingCycleLabel} · {sub.amountLabel}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <StatusBadge value={sub.status} map="subscription" />
                  {sub.pendingCharges > 0 && (
                    <span className="text-[var(--text-muted)]">
                      {sub.pendingCharges} cobrança(s) pendente(s)
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </ul>
        )}
      </section>

      <section id="faturas">
        <SectionHeader title="Faturas da empresa" />
        {invoices.length === 0 ? (
          <EmptyState message="Nenhuma fatura emitida ainda." />
        ) : (
          <ul className="mt-4 space-y-2">
            {invoices.map((inv) => (
              <Card key={inv.id} padding="sm" className="flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0 flex-1 text-sm text-[var(--text-secondary)]">
                  {inv.createdAtLabel} · {inv.patientName} ·{" "}
                  <StatusBadge value={inv.status} map="invoice" />
                </span>
                <span className="shrink-0 font-semibold text-[var(--text-primary)]">{inv.totalLabel}</span>
              </Card>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
