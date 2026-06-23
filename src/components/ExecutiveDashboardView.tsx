"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LoadingState from "@/components/ui/LoadingState";
import Alert from "@/components/ui/Alert";
import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import { useLabels } from "@/hooks/useLabels";

type Dashboard = {
  generatedAtLabel: string;
  kpis: {
    totalPatients: number;
    totalCompanies: number;
    appointmentsToday: number;
    pendingBillingLabel: string;
    totalInvoicedLabel: string;
    activeSubscriptions: number;
    mrrEstimateLabel: string;
    pendingMessages: number;
    pendingRecurrenceCharges: number;
  };
  revenue: {
    pendingPayPerUseLabel: string;
    pendingRecurrenceLabel: string;
    invoicedOpenLabel: string;
    invoicedPaidLabel: string;
  };
  crm: {
    activeContracts: number;
    byStatus: { status: string; label: string; count: number }[];
  };
  topPendingBilling: {
    patientId: string;
    patientName: string;
    totalLabel: string;
    itemsCount: number;
  }[];
  recentActivity: {
    id: string;
    action: string;
    description: string;
    createdAtLabel: string;
    actorName: string | null;
  }[];
};

const quickLinks = [
  { href: "/interno", label: "Faturamento", desc: "Gerar faturas Pay Per Use" },
  { href: "/interno/crm", label: "CRM", desc: "Pipeline de empresas" },
  { href: "/interno/assinaturas", label: "Recorrência", desc: "Assinaturas e cobranças" },
  { href: "/interno/comunicacao", label: "Comunicação", desc: "Fila de mensagens" },
  { href: "/interno/auditoria", label: "Auditoria", desc: "Timeline universal do tenant" },
];

export default function ExecutiveDashboardView() {
  const { labels } = useLabels();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/interno/dashboard");
      const data = await res.json();
      if (!active) return;
      if (!res.ok) setError(data.error ?? "Erro ao carregar dashboard");
      else setDashboard(data.dashboard);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (error) return <Alert tone="danger">{error}</Alert>;
  if (!dashboard) return <LoadingState message="Carregando indicadores..." />;

  const { kpis, revenue, crm } = dashboard;

  return (
    <div className="space-y-8">
      <p className="text-xs text-[var(--text-muted)]">Atualizado em {dashboard.generatedAtLabel}</p>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Indicadores principais
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Pendente Pay Per Use" value={kpis.pendingBillingLabel} tone="warning" />
          <StatCard label="Total faturado" value={kpis.totalInvoicedLabel} tone="accent" />
          <StatCard
            label="MRR estimado (recorrência)"
            value={kpis.mrrEstimateLabel}
            tone="success"
            hint={`${kpis.activeSubscriptions} assinatura(s) ativa(s)`}
          />
          <StatCard label="Atendimentos hoje" value={kpis.appointmentsToday} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Operacional
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={labels.beneficiaries} value={kpis.totalPatients} />
          <StatCard
            label="Empresas (CRM)"
            value={kpis.totalCompanies}
            hint={`${crm.activeContracts} contrato(s) ativo(s)`}
          />
          <StatCard
            label="Cobranças recorrentes pendentes"
            value={kpis.pendingRecurrenceCharges}
            hint={revenue.pendingRecurrenceLabel}
          />
          <StatCard label="Mensagens na fila" value={kpis.pendingMessages} />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card padding="sm">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Receita</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--text-muted)]">Pay Per Use pendente</dt>
              <dd className="font-semibold text-[var(--status-warning-text)]">
                {revenue.pendingPayPerUseLabel}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--text-muted)]">Recorrência pendente</dt>
              <dd className="font-semibold text-[var(--status-warning-text)]">
                {revenue.pendingRecurrenceLabel}
              </dd>
            </div>
            <div className="flex justify-between border-t border-[var(--border-default)] pt-3">
              <dt className="text-[var(--text-muted)]">Faturas em aberto</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{revenue.invoicedOpenLabel}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--text-muted)]">Faturas pagas</dt>
              <dd className="font-semibold text-[var(--status-success-text)]">
                {revenue.invoicedPaidLabel}
              </dd>
            </div>
          </dl>
        </Card>

        <Card padding="sm">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Pipeline CRM</h2>
          {crm.byStatus.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--text-muted)]">Nenhuma empresa cadastrada.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {crm.byStatus.map((row) => (
                <li key={row.status} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">{row.label}</span>
                  <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-0.5 font-medium text-[var(--text-primary)]">
                    {row.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/interno/crm"
            className="mt-4 inline-block text-sm font-medium text-[var(--portal-accent)] hover:underline"
          >
            Ver pipeline completo →
          </Link>
        </Card>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Maiores pendências Pay Per Use</h2>
        {dashboard.topPendingBilling.length === 0 ? (
          <p className="mt-3 rounded-lg bg-[var(--surface-card)] p-4 text-[var(--text-muted)]">
            Nenhum procedimento pendente de faturamento.
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[var(--shadow-card)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-2 font-medium">{labels.beneficiary}</th>
                  <th className="px-4 py-2 font-medium">Itens</th>
                  <th className="px-4 py-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {dashboard.topPendingBilling.map((row) => (
                  <tr key={row.patientId}>
                    <td className="px-4 py-2">
                      <Link
                        href={`/interno/beneficiarios/${row.patientId}?from=/interno/dashboard`}
                        className="font-medium text-[var(--portal-accent)] hover:underline"
                      >
                        {row.patientName}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-[var(--text-muted)]">{row.itemsCount}</td>
                    <td className="px-4 py-2 text-right font-semibold text-[var(--text-primary)]">
                      {row.totalLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Atividade recente</h2>
          <Link href="/interno/auditoria" className="text-sm font-medium text-[var(--portal-accent)] hover:underline">
            Ver auditoria completa
          </Link>
        </div>
        {dashboard.recentActivity.length === 0 ? (
          <p className="mt-3 rounded-lg bg-[var(--surface-card)] p-4 text-[var(--text-muted)]">
            Nenhum evento registrado.
          </p>
        ) : (
          <ol className="relative mt-4 space-y-0 border-l border-[var(--portal-accent)]/30 pl-6">
            {dashboard.recentActivity.map((event) => (
              <li key={event.id} className="relative pb-5 last:pb-0">
                <span className="absolute -left-[1.625rem] top-1.5 h-3 w-3 rounded-full border-2 border-[var(--surface-card)] bg-[var(--portal-accent)] ring-2 ring-[var(--portal-accent)]/20" />
                <Card padding="sm">
                  <p className="text-xs text-[var(--text-muted)]">{event.createdAtLabel}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{event.description}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {event.actorName ?? "Sistema"} · {event.action.replaceAll("_", " ")}
                  </p>
                </Card>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Acesso rápido</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card
                padding="sm"
                className="h-full transition hover:border-[var(--portal-accent)] hover:shadow-md"
              >
                <p className="font-semibold text-[var(--portal-accent)]">{link.label}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{link.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
