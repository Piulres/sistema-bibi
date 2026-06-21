"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingState from "@/components/ui/LoadingState";
import Alert from "@/components/ui/Alert";

type Overview = {
  patient: {
    name: string;
    cpf: string;
    birthDateLabel: string;
    phone: string | null;
    company: { name: string; cnpj: string } | null;
  };
  summary: {
    totalAppointments: number;
    totalUsages: number;
    pendingAmountLabel: string;
    totalInvoicedLabel: string;
  };
  nextAppointment: {
    scheduledAtLabel: string;
    status: string;
    reason: string | null;
    providerName: string;
  } | null;
  appointments: {
    id: string;
    scheduledAtLabel: string;
    status: string;
    reason: string | null;
    providerName: string;
    usagesCount: number;
  }[];
  usages: {
    id: string;
    procedure: string;
    category: string;
    priceLabel: string;
    billed: boolean;
    performedAtLabel: string;
    appointmentDateLabel: string;
  }[];
  invoices: {
    id: string;
    totalLabel: string;
    status: string;
    createdAtLabel: string;
    items: { id: string; description: string; amountLabel: string }[];
  }[];
  subscriptions: {
    id: string;
    status: string;
    statusLabel: string;
    billingCycleLabel: string;
    amountLabel: string;
    description: string | null;
    pendingCharges: number;
    nextDueDateLabel: string | null;
    charges: {
      id: string;
      dueDateLabel: string;
      amountLabel: string;
      status: string;
    }[];
  }[];
  medicalRecords: {
    id: string;
    content: string;
    createdAtLabel: string;
    providerName: string;
    appointmentDateLabel: string | null;
  }[];
  timeline: {
    id: string;
    action: string;
    description: string;
    createdAtLabel: string;
  }[];
};

export default function BeneficiarioView() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/beneficiario/overview");
      const data = await res.json();
      if (!active) return;
      if (!res.ok) setError(data.error ?? "Erro ao carregar seus dados");
      else setOverview(data.overview);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <LoadingState message="Carregando seu painel..." />;
  if (error || !overview) {
    return <Alert tone="danger">{error ?? "Dados indisponíveis"}</Alert>;
  }

  const { patient, summary, nextAppointment } = overview;
  const activeSubscription = overview.subscriptions.find((s) => s.status === "ATIVA");

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">{patient.name}</h2>
        <p className="mt-1 text-sm text-slate-500">CPF {patient.cpf}</p>
        <p className="text-sm text-slate-500">
          Nascimento: {patient.birthDateLabel}
          {patient.phone ? ` · Tel. ${patient.phone}` : ""}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {patient.company
            ? `Plano corporativo: ${patient.company.name}`
            : "Atendimento particular"}
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Próximo atendimento</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {nextAppointment?.scheduledAtLabel ?? "Nenhum agendado"}
          </p>
          {nextAppointment && (
            <p className="mt-1 text-xs text-slate-500">
              {nextAppointment.providerName} · {nextAppointment.reason ?? "Consulta"}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pendente (Pay Per Use)</p>
          <p className="mt-1 text-lg font-semibold text-amber-700">{summary.pendingAmountLabel}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total faturado</p>
          <p className="mt-1 text-lg font-semibold text-indigo-700">{summary.totalInvoicedLabel}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Assinatura</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {activeSubscription?.billingCycleLabel ?? "Sem plano ativo"}
          </p>
          {activeSubscription && (
            <p className="mt-1 text-xs text-slate-500">{activeSubscription.amountLabel}/ciclo</p>
          )}
        </div>
      </div>

      <section>
        <h3 className="text-lg font-semibold text-slate-900">Minha agenda</h3>
        {overview.appointments.length === 0 ? (
          <p className="mt-3 rounded-lg bg-white p-4 text-slate-500">Nenhum atendimento registrado.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Data</th>
                  <th className="px-4 py-2 font-medium">Prestador</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overview.appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-4 py-2 text-slate-800">{appointment.scheduledAtLabel}</td>
                    <td className="px-4 py-2 text-slate-600">{appointment.providerName}</td>
                    <td className="px-4 py-2">
                      <StatusBadge value={appointment.status} map="appointment" />
                    </td>
                    <td className="px-4 py-2 text-slate-500">{appointment.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900">Meu consumo (Pay Per Use)</h3>
        <p className="mt-1 text-sm text-slate-500">
          Transparência prévia — você paga apenas pelo que foi utilizado.
        </p>
        {overview.usages.length === 0 ? (
          <p className="mt-3 rounded-lg bg-white p-4 text-slate-500">Nenhum procedimento registrado.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Procedimento</th>
                  <th className="px-4 py-2 font-medium">Atendimento</th>
                  <th className="px-4 py-2 font-medium">Situação</th>
                  <th className="px-4 py-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overview.usages.map((usage) => (
                  <tr key={usage.id}>
                    <td className="px-4 py-2">
                      <p className="font-medium text-slate-800">{usage.procedure}</p>
                      <p className="text-xs text-slate-400">{usage.category}</p>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{usage.appointmentDateLabel}</td>
                    <td className="px-4 py-2">
                      <StatusBadge value={usage.billed ? "PAGA" : "ABERTA"} map="invoice" />
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-slate-900">{usage.priceLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900">Minhas faturas</h3>
        {overview.invoices.length === 0 ? (
          <p className="mt-3 rounded-lg bg-white p-4 text-slate-500">Nenhuma fatura emitida.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {overview.invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{invoice.totalLabel}</p>
                    <p className="text-sm text-slate-500">{invoice.createdAtLabel}</p>
                  </div>
                  <StatusBadge value={invoice.status} map="invoice" />
                </div>
                <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
                  {invoice.items.map((item) => (
                    <li key={item.id} className="flex justify-between py-2 text-sm">
                      <span className="text-slate-700">{item.description}</span>
                      <span className="text-slate-500">{item.amountLabel}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900">Minha assinatura</h3>
        {overview.subscriptions.length === 0 ? (
          <p className="mt-3 rounded-lg bg-white p-4 text-slate-500">
            Você não possui assinatura recorrente.
          </p>
        ) : (
          <div className="mt-3 space-y-4">
            {overview.subscriptions.map((sub) => (
              <article
                key={sub.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {sub.billingCycleLabel} · {sub.amountLabel}
                    </p>
                    {sub.description && (
                      <p className="mt-1 text-sm text-slate-600">{sub.description}</p>
                    )}
                    <p className="mt-2 text-xs text-slate-500">
                      {sub.pendingCharges} cobrança(s) pendente(s)
                      {sub.nextDueDateLabel ? ` · próxima: ${sub.nextDueDateLabel}` : ""}
                    </p>
                  </div>
                  <StatusBadge value={sub.status} map="subscription" />
                </div>
                {sub.charges.length > 0 && (
                  <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
                    {sub.charges.map((charge) => (
                      <li key={charge.id} className="flex justify-between py-2 text-sm">
                        <span className="text-slate-700">{charge.dueDateLabel}</span>
                        <span className="text-slate-500">
                          {charge.amountLabel} · {charge.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900">Meu prontuário</h3>
        {overview.medicalRecords.length === 0 ? (
          <p className="mt-3 rounded-lg bg-white p-4 text-slate-500">Nenhuma anotação clínica.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {overview.medicalRecords.map((record) => (
              <article
                key={record.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>{record.providerName}</span>
                  <span>{record.createdAtLabel}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{record.content}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900">Histórico de atividades</h3>
        {overview.timeline.length === 0 ? (
          <p className="mt-3 rounded-lg bg-white p-4 text-slate-500">Nenhum evento registrado.</p>
        ) : (
          <ol className="relative mt-4 space-y-0 border-l border-teal-200 pl-6">
            {overview.timeline.slice(0, 10).map((event) => (
              <li key={event.id} className="relative pb-6 last:pb-0">
                <span className="absolute -left-[1.625rem] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-teal-500 ring-2 ring-teal-100" />
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-400">{event.createdAtLabel}</p>
                  <p className="mt-1 text-sm text-slate-800">{event.description}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
