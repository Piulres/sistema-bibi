"use client";

import Link from "next/link";
import { useCallback } from "react";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import CalloutCard from "@/components/ui/CalloutCard";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { useLabels } from "@/hooks/useLabels";
import { useAsyncData } from "@/hooks/useAsyncData";
import { fetchJson } from "@/lib/ui/api-feedback";

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
  clinicFinance: {
    year: number;
    month: number;
    examCount: number;
    revenueLabel: string;
    expensesLabel: string;
    profitLabel: string;
  } | null;
};

const quickLinks = [
  { href: "/interno/gestao", label: "Gestão clínica" },
  { href: "/interno", label: "Faturamento" },
  { href: "/interno/crm", label: "CRM" },
  { href: "/interno/assinaturas", label: "Recorrência" },
  { href: "/interno/comunicacao", label: "Comunicação" },
  { href: "/interno/auditoria", label: "Auditoria" },
];

function RevenueRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "text-[var(--status-warning-text)]"
      : tone === "success"
        ? "text-[var(--status-success-text)]"
        : "text-[var(--text-primary)]";

  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-sm text-[var(--text-muted)]">{label}</dt>
      <dd className={`shrink-0 text-sm font-semibold tabular-nums ${toneClass}`}>{value}</dd>
    </div>
  );
}

export default function ExecutiveDashboardView() {
  const { labels } = useLabels();

  const loadDashboard = useCallback(
    () =>
      fetchJson<{ dashboard: Dashboard }>(
        "/api/interno/dashboard",
        undefined,
        "Erro ao carregar dashboard",
      ),
    [],
  );

  const { data, loading, error, reload } = useAsyncData(loadDashboard, [], {
    forbiddenMessage: "Sem permissão para acessar o dashboard",
  });

  const dashboard = data?.dashboard ?? null;

  return (
    <ViewStateBoundary
      loading={loading}
      error={error}
      loadingMessage="Carregando indicadores..."
      onRetry={() => void reload()}
    >
      {dashboard && (
        <div className="space-y-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-[var(--text-muted)]">
              Atualizado em {dashboard.generatedAtLabel}
            </p>
            <Button variant="ghost" size="sm" type="button" onClick={() => void reload()}>
              Atualizar
            </Button>
          </div>

          <CalloutCard
            variant="info"
            title="Fonte dos números"
            description="Lançamentos e despesas do piloto ficam em Gestão clínica. Este painel resume PPU e CRM — exames lançados também geram fatura aqui, sem somar a receita operacional duas vezes."
            data-cursor-id="dashboard-gestao-hint"
          >
            <Link href="/interno/gestao">
              <Button variant="portal" size="sm">
                Abrir gestão clínica
              </Button>
            </Link>
          </CalloutCard>

          <section>
            <SectionHeader
              title="Indicadores principais"
              description="Snapshot financeiro e operacional do tenant."
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Pendente Pay Per Use"
                value={dashboard.kpis.pendingBillingLabel}
                tone="warning"
                info="Procedimentos ainda não convertidos em fatura."
              />
              <StatCard
                label="Total faturado"
                value={dashboard.kpis.totalInvoicedLabel}
                tone="accent"
                info="Soma das faturas emitidas (abertas e pagas)."
              />
              <StatCard
                label="MRR estimado"
                value={dashboard.kpis.mrrEstimateLabel}
                tone="success"
                hint={`${dashboard.kpis.activeSubscriptions} assinatura(s) ativa(s)`}
                info="Receita recorrente mensal equivalente das assinaturas ativas."
              />
              <StatCard
                label="Atendimentos hoje"
                value={dashboard.kpis.appointmentsToday}
                info={`${labels.appointments} do dia no tenant.`}
              />
            </div>

            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-muted)]/40 px-4 py-3 text-sm text-[var(--text-secondary)]">
              <li>
                <span className="text-[var(--text-muted)]">{labels.beneficiaries}: </span>
                <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                  {dashboard.kpis.totalPatients}
                </span>
              </li>
              <li>
                <span className="text-[var(--text-muted)]">Empresas: </span>
                <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                  {dashboard.kpis.totalCompanies}
                </span>
                <span className="text-[var(--text-muted)]">
                  {" "}
                  · {dashboard.crm.activeContracts} contrato(s)
                </span>
              </li>
              <li>
                <span className="text-[var(--text-muted)]">Recorrência pendente: </span>
                <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                  {dashboard.kpis.pendingRecurrenceCharges}
                </span>
              </li>
              <li>
                <span className="text-[var(--text-muted)]">Mensagens na fila: </span>
                <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                  {dashboard.kpis.pendingMessages}
                </span>
              </li>
            </ul>
          </section>

          {dashboard.clinicFinance && (
            <section data-cursor-id="dashboard-clinic-finance">
              <SectionHeader
                title={`Gestão clínica · ${String(dashboard.clinicFinance.month).padStart(2, "0")}/${dashboard.clinicFinance.year}`}
                description="Resultado operacional do mês (lançamentos − despesas)."
              />
              <Card accent padding="md" className="mt-4">
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-xs text-[var(--text-muted)]">Exames lançados</dt>
                    <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--text-primary)]">
                      {dashboard.clinicFinance.examCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--text-muted)]">Receita</dt>
                    <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--portal-accent)]">
                      {dashboard.clinicFinance.revenueLabel}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--text-muted)]">Despesas</dt>
                    <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--status-warning-text)]">
                      {dashboard.clinicFinance.expensesLabel}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--text-muted)]">Lucro operacional</dt>
                    <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--status-success-text)]">
                      {dashboard.clinicFinance.profitLabel}
                    </dd>
                  </div>
                </dl>
              </Card>
            </section>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card padding="md">
              <SectionHeader title="Receita" description="Composição de pendências e faturas." />
              <dl className="mt-4 divide-y divide-[var(--border-default)]">
                <RevenueRow
                  label="Pay Per Use pendente"
                  value={dashboard.revenue.pendingPayPerUseLabel}
                  tone="warning"
                />
                <RevenueRow
                  label="Recorrência pendente"
                  value={dashboard.revenue.pendingRecurrenceLabel}
                  tone="warning"
                />
                <RevenueRow
                  label="Faturas em aberto"
                  value={dashboard.revenue.invoicedOpenLabel}
                />
                <RevenueRow
                  label="Faturas pagas"
                  value={dashboard.revenue.invoicedPaidLabel}
                  tone="success"
                />
              </dl>
            </Card>

            <Card padding="md">
              <SectionHeader title="Pipeline CRM" description="Empresas por estágio." />
              {dashboard.crm.byStatus.length === 0 ? (
                <EmptyState
                  className="mt-4"
                  message="Nenhuma empresa cadastrada."
                  hint="Cadastre leads no CRM para acompanhar o funil aqui."
                />
              ) : (
                <ul className="mt-4 space-y-2">
                  {dashboard.crm.byStatus.map((row) => {
                    const max = Math.max(...dashboard.crm.byStatus.map((r) => r.count), 1);
                    const width = Math.max(8, Math.round((row.count / max) * 100));
                    return (
                      <li key={row.status}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-[var(--text-secondary)]">{row.label}</span>
                          <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                            {row.count}
                          </span>
                        </div>
                        <div
                          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]"
                          aria-hidden
                        >
                          <div
                            className="h-full rounded-full bg-[var(--portal-accent)]/70"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Link href="/interno/crm" className="ds-touch-link mt-5 inline-flex">
                Ver pipeline completo →
              </Link>
            </Card>
          </div>

          <section>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <SectionHeader
                title="Maiores pendências Pay Per Use"
                description={`Priorize faturamento pelos ${labels.beneficiaries.toLowerCase()} com maior valor em aberto.`}
              />
              <Link href="/interno" className="ds-touch-link">
                Ir ao faturamento
              </Link>
            </div>
            {dashboard.topPendingBilling.length === 0 ? (
              <EmptyState
                message={`Nenhum ${labels.procedure.toLowerCase()} pendente de faturamento.`}
              />
            ) : (
              <>
                <ul className="mt-4 space-y-2 md:hidden">
                  {dashboard.topPendingBilling.map((row) => (
                    <li
                      key={row.patientId}
                      className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-card)] p-3 shadow-[var(--shadow-card)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/interno/beneficiarios/${row.patientId}?from=/interno/dashboard`}
                            className="ds-touch-link px-0 font-medium"
                          >
                            {row.patientName}
                          </Link>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            {row.itemsCount} item{row.itemsCount === 1 ? "" : "s"}
                          </p>
                        </div>
                        <p className="shrink-0 font-semibold tabular-nums text-[var(--text-primary)]">
                          {row.totalLabel}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="ds-scroll-x mt-4 hidden rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[var(--shadow-card)] md:block">
                  <table className="w-full min-w-[28rem] text-left text-sm">
                    <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">{labels.beneficiary}</th>
                        <th className="px-4 py-2.5 font-medium">Itens</th>
                        <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-default)]">
                      {dashboard.topPendingBilling.map((row) => (
                        <tr key={row.patientId} className="hover:bg-[var(--surface-muted)]/40">
                          <td className="px-4 py-2.5">
                            <Link
                              href={`/interno/beneficiarios/${row.patientId}?from=/interno/dashboard`}
                              className="ds-touch-link px-0 font-medium"
                            >
                              {row.patientName}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 tabular-nums text-[var(--text-muted)]">
                            {row.itemsCount}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-[var(--text-primary)]">
                            {row.totalLabel}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          <section>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <SectionHeader
                title="Atividade recente"
                description="Últimos eventos do tenant."
              />
              <Link href="/interno/auditoria" className="ds-touch-link">
                Ver auditoria completa
              </Link>
            </div>
            {dashboard.recentActivity.length === 0 ? (
              <EmptyState message="Nenhum evento registrado." />
            ) : (
              <ol className="relative mt-4 space-y-0 border-l border-[var(--border-default)] pl-5">
                {dashboard.recentActivity.map((event) => (
                  <li key={event.id} className="relative pb-5 last:pb-0">
                    <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--portal-accent)] ring-4 ring-[var(--surface-page)]" />
                    <p className="text-xs text-[var(--text-muted)]">{event.createdAtLabel}</p>
                    <p className="mt-0.5 text-sm text-[var(--text-primary)]">{event.description}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {event.actorName ?? "Sistema"} · {event.action.replaceAll("_", " ")}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section>
            <SectionHeader title="Acesso rápido" />
            <nav className="mt-3 flex flex-wrap gap-2" aria-label="Acesso rápido">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex min-h-10 items-center rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-card)] px-3.5 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--portal-accent)] hover:text-[var(--portal-accent)]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </section>
        </div>
      )}
    </ViewStateBoundary>
  );
}
