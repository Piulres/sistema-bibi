"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
];

export default function ExecutiveDashboardView() {
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

  if (error) return <p className="text-red-600">{error}</p>;
  if (!dashboard) return <p className="text-slate-500">Carregando indicadores...</p>;

  const { kpis, revenue, crm } = dashboard;

  return (
    <div className="space-y-8">
      <p className="text-xs text-slate-400">Atualizado em {dashboard.generatedAtLabel}</p>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Indicadores principais
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pendente Pay Per Use</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{kpis.pendingBillingLabel}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total faturado</p>
            <p className="mt-1 text-2xl font-bold text-indigo-700">{kpis.totalInvoicedLabel}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">MRR estimado (recorrência)</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{kpis.mrrEstimateLabel}</p>
            <p className="mt-1 text-xs text-slate-400">
              {kpis.activeSubscriptions} assinatura(s) ativa(s)
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Atendimentos hoje</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{kpis.appointmentsToday}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Operacional
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Beneficiários</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{kpis.totalPatients}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Empresas (CRM)</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{kpis.totalCompanies}</p>
            <p className="mt-1 text-xs text-slate-400">{crm.activeContracts} contrato(s) ativo(s)</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Cobranças recorrentes pendentes</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {kpis.pendingRecurrenceCharges}
            </p>
            <p className="mt-1 text-xs text-slate-400">{revenue.pendingRecurrenceLabel}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Mensagens na fila</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{kpis.pendingMessages}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Receita</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Pay Per Use pendente</dt>
              <dd className="font-semibold text-amber-700">{revenue.pendingPayPerUseLabel}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Recorrência pendente</dt>
              <dd className="font-semibold text-amber-700">{revenue.pendingRecurrenceLabel}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3">
              <dt className="text-slate-500">Faturas em aberto</dt>
              <dd className="font-semibold text-slate-900">{revenue.invoicedOpenLabel}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Faturas pagas</dt>
              <dd className="font-semibold text-emerald-700">{revenue.invoicedPaidLabel}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Pipeline CRM</h2>
          {crm.byStatus.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Nenhuma empresa cadastrada.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {crm.byStatus.map((row) => (
                <li key={row.status} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{row.label}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-800">
                    {row.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/interno/crm"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Ver pipeline completo →
          </Link>
        </section>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Maiores pendências Pay Per Use</h2>
        {dashboard.topPendingBilling.length === 0 ? (
          <p className="mt-3 rounded-lg bg-white p-4 text-slate-500">
            Nenhum procedimento pendente de faturamento.
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Beneficiário</th>
                  <th className="px-4 py-2 font-medium">Itens</th>
                  <th className="px-4 py-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboard.topPendingBilling.map((row) => (
                  <tr key={row.patientId}>
                    <td className="px-4 py-2">
                      <Link
                        href={`/interno/beneficiarios/${row.patientId}?from=/interno/dashboard`}
                        className="font-medium text-indigo-700 hover:underline"
                      >
                        {row.patientName}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate-500">{row.itemsCount}</td>
                    <td className="px-4 py-2 text-right font-semibold text-slate-900">
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
        <h2 className="text-lg font-semibold text-slate-900">Atividade recente</h2>
        {dashboard.recentActivity.length === 0 ? (
          <p className="mt-3 rounded-lg bg-white p-4 text-slate-500">Nenhum evento registrado.</p>
        ) : (
          <ol className="relative mt-4 space-y-0 border-l border-indigo-200 pl-6">
            {dashboard.recentActivity.map((event) => (
              <li key={event.id} className="relative pb-5 last:pb-0">
                <span className="absolute -left-[1.625rem] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-indigo-500 ring-2 ring-indigo-100" />
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-400">{event.createdAtLabel}</p>
                  <p className="mt-1 text-sm text-slate-800">{event.description}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {event.actorName ?? "Sistema"} · {event.action.replaceAll("_", " ")}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Acesso rápido</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >
              <p className="font-semibold text-indigo-700">{link.label}</p>
              <p className="mt-1 text-xs text-slate-500">{link.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
