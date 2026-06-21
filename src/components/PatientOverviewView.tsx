"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Overview = {
  patient: {
    id: string;
    name: string;
    cpf: string;
    birthDateLabel: string;
    phone: string | null;
    company: { id: string; name: string; cnpj: string } | null;
    createdAtLabel: string;
  };
  summary: {
    totalAppointments: number;
    totalUsages: number;
    totalRecords: number;
    totalInvoicedLabel: string;
    pendingAmountLabel: string;
  };
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
  medicalRecords: {
    id: string;
    content: string;
    createdAtLabel: string;
    providerName: string;
    appointmentDateLabel: string | null;
  }[];
  invoices: {
    id: string;
    totalLabel: string;
    status: string;
    createdAtLabel: string;
    company: string | null;
    items: { id: string; description: string; amountLabel: string }[];
  }[];
  timeline: {
    id: string;
    entityType: string;
    action: string;
    description: string;
    createdAtLabel: string;
    actorName: string | null;
  }[];
};

const statusClass: Record<string, string> = {
  AGENDADO: "bg-slate-100 text-slate-700",
  CONFIRMADO: "bg-blue-100 text-blue-700",
  REALIZADO: "bg-emerald-100 text-emerald-700",
  FALTOU: "bg-amber-100 text-amber-700",
  CANCELADO: "bg-red-100 text-red-700",
  FECHADA: "bg-indigo-100 text-indigo-700",
  PAGA: "bg-emerald-100 text-emerald-700",
  ABERTA: "bg-amber-100 text-amber-700",
};

const actionClass: Record<string, string> = {
  LOGIN: "bg-violet-100 text-violet-700",
  CREATED: "bg-sky-100 text-sky-700",
  UPDATED: "bg-slate-100 text-slate-700",
  APPOINTMENT_COMPLETED: "bg-emerald-100 text-emerald-700",
  PROCEDURE_REGISTERED: "bg-indigo-100 text-indigo-700",
  MEDICAL_RECORD_CREATED: "bg-teal-100 text-teal-700",
  INVOICE_ISSUED: "bg-fuchsia-100 text-fuchsia-700",
  CHARGE_SENT: "bg-orange-100 text-orange-700",
  CONTRACT_CHANGED: "bg-amber-100 text-amber-700",
  SUBSCRIPTION_CHARGES_GENERATED: "bg-cyan-100 text-cyan-700",
};

function ActionBadge({ value }: { value: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${actionClass[value] ?? "bg-slate-100 text-slate-700"}`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

function Badge({ value }: { value: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass[value] ?? "bg-slate-100 text-slate-700"}`}
    >
      {value}
    </span>
  );
}

export default function PatientOverviewView({ patientId }: { patientId: string }) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch(`/api/interno/patients/${patientId}/overview`);
      const data = await res.json();
      if (!active) return;
      if (!res.ok) {
        setError(data.error ?? "Erro ao carregar beneficiário");
      } else {
        setOverview(data.overview);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [patientId]);

  if (loading) return <p className="text-slate-500">Carregando Cliente 360°...</p>;
  if (error || !overview) return <p className="text-red-600">{error ?? "Beneficiário não encontrado"}</p>;

  const { patient, summary } = overview;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/interno"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          ← Voltar ao faturamento
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Cliente 360°</h1>
        <p className="mt-1 text-slate-600">
          Visão consolidada do beneficiário — dados, atendimentos, procedimentos e faturamento.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{patient.name}</h2>
            <p className="mt-1 text-sm text-slate-500">CPF {patient.cpf}</p>
            <p className="text-sm text-slate-500">
              Nascimento: {patient.birthDateLabel}
              {patient.phone ? ` · Tel. ${patient.phone}` : ""}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {patient.company ? (
                <>
                  Empresa: <span className="font-medium">{patient.company.name}</span> (CNPJ{" "}
                  {patient.company.cnpj})
                </>
              ) : (
                "Particular (sem empresa vinculada)"
              )}
            </p>
          </div>
          <p className="text-xs text-slate-400">Cadastro em {patient.createdAtLabel}</p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Atendimentos</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary.totalAppointments}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Procedimentos (Pay Per Use)</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary.totalUsages}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pendente de faturamento</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{summary.pendingAmountLabel}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total faturado</p>
          <p className="mt-1 text-2xl font-bold text-indigo-700">{summary.totalInvoicedLabel}</p>
        </div>
      </div>

      <section>
        <h3 className="text-lg font-semibold text-slate-900">Timeline universal</h3>
        <p className="mt-1 text-sm text-slate-500">
          Histórico auditável de eventos relacionados a este beneficiário.
        </p>
        {overview.timeline.length === 0 ? (
          <p className="mt-3 rounded-lg bg-white p-4 text-slate-500">Nenhum evento registrado.</p>
        ) : (
          <ol className="relative mt-4 space-y-0 border-l border-indigo-200 pl-6">
            {overview.timeline.map((event) => (
              <li key={event.id} className="relative pb-6 last:pb-0">
                <span className="absolute -left-[1.625rem] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-indigo-500 ring-2 ring-indigo-100" />
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <ActionBadge value={event.action} />
                    <span className="text-xs text-slate-400">{event.createdAtLabel}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-800">{event.description}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {event.actorName ?? "Sistema"} · {event.entityType}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900">Atendimentos</h3>
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
                  <th className="px-4 py-2 text-right font-medium">Procedimentos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overview.appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-4 py-2 text-slate-800">{appointment.scheduledAtLabel}</td>
                    <td className="px-4 py-2 text-slate-600">{appointment.providerName}</td>
                    <td className="px-4 py-2">
                      <Badge value={appointment.status} />
                    </td>
                    <td className="px-4 py-2 text-slate-500">{appointment.reason ?? "—"}</td>
                    <td className="px-4 py-2 text-right text-slate-700">{appointment.usagesCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900">Procedimentos realizados</h3>
        {overview.usages.length === 0 ? (
          <p className="mt-3 rounded-lg bg-white p-4 text-slate-500">Nenhum procedimento registrado.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Procedimento</th>
                  <th className="px-4 py-2 font-medium">Atendimento</th>
                  <th className="px-4 py-2 font-medium">Realizado em</th>
                  <th className="px-4 py-2 font-medium">Faturado</th>
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
                    <td className="px-4 py-2 text-slate-600">{usage.performedAtLabel}</td>
                    <td className="px-4 py-2">
                      <Badge value={usage.billed ? "PAGA" : "ABERTA"} />
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
        <h3 className="text-lg font-semibold text-slate-900">
          Prontuário eletrônico ({summary.totalRecords})
        </h3>
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
                {record.appointmentDateLabel && (
                  <p className="mt-1 text-xs text-slate-400">
                    Atendimento: {record.appointmentDateLabel}
                  </p>
                )}
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{record.content}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900">Faturas</h3>
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
                    <p className="text-sm text-slate-500">
                      {invoice.createdAtLabel} · {invoice.company ?? "Particular"}
                    </p>
                  </div>
                  <Badge value={invoice.status} />
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
    </div>
  );
}
