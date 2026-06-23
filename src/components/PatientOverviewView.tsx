"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingState from "@/components/ui/LoadingState";
import Alert from "@/components/ui/Alert";
import ExportButtons from "@/components/ExportButtons";

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

export default function PatientOverviewView({
  patientId,
}: {
  patientId: string;
}) {
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

  if (loading) return <LoadingState message="Carregando Cliente 360°..." />;
  if (error || !overview) {
    return <Alert tone="danger">{error ?? "Beneficiário não encontrado"}</Alert>;
  }

  const { patient, summary } = overview;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <ExportButtons
          baseUrl={`/api/interno/patients/${patientId}/export`}
          query={{ section: "summary" }}
          formats={["pdf", "xlsx"]}
        />
        <a
          href={`/api/interno/patients/${patientId}/export?format=json`}
          download
          className="text-sm font-medium text-[var(--portal-accent)] hover:underline"
        >
          LGPD (JSON)
        </a>
      </div>

      <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">{patient.name}</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">CPF {patient.cpf}</p>
            <p className="text-sm text-[var(--text-muted)]">
              Nascimento: {patient.birthDateLabel}
              {patient.phone ? ` · Tel. ${patient.phone}` : ""}
            </p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
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
          <p className="text-xs text-[var(--text-muted)]">Cadastro em {patient.createdAtLabel}</p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm">
          <p className="text-sm text-[var(--text-muted)]">Atendimentos</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{summary.totalAppointments}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm">
          <p className="text-sm text-[var(--text-muted)]">Procedimentos (Pay Per Use)</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{summary.totalUsages}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm">
          <p className="text-sm text-[var(--text-muted)]">Pendente de faturamento</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{summary.pendingAmountLabel}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm">
          <p className="text-sm text-[var(--text-muted)]">Total faturado</p>
          <p className="mt-1 text-2xl font-bold text-[var(--portal-accent)]">{summary.totalInvoicedLabel}</p>
        </div>
      </div>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Timeline universal</h3>
          <ExportButtons
            baseUrl={`/api/interno/patients/${patientId}/export`}
            query={{ section: "timeline" }}
          />
        </div>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Histórico auditável de eventos relacionados a este beneficiário.
        </p>
        {overview.timeline.length === 0 ? (
          <p className="mt-3 rounded-lg bg-[var(--surface-card)] p-4 text-[var(--text-muted)]">Nenhum evento registrado.</p>
        ) : (
          <ol className="relative mt-4 space-y-0 border-l border-[var(--border-default)] pl-6">
            {overview.timeline.map((event) => (
              <li key={event.id} className="relative pb-6 last:pb-0">
                <span className="absolute -left-[1.625rem] top-1.5 h-3 w-3 rounded-full border-2 border-[var(--surface-card)] bg-[var(--portal-accent)] ring-2 ring-[var(--surface-muted)]" />
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={event.action} map="timeline" />
                    <span className="text-xs text-[var(--text-muted)]">{event.createdAtLabel}</span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{event.description}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {event.actorName ?? "Sistema"} · {event.entityType}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Atendimentos</h3>
          <ExportButtons
            baseUrl={`/api/interno/patients/${patientId}/export`}
            query={{ section: "appointments" }}
          />
        </div>
        {overview.appointments.length === 0 ? (
          <p className="mt-3 rounded-lg bg-[var(--surface-card)] p-4 text-[var(--text-muted)]">Nenhum atendimento registrado.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-2 font-medium">Data</th>
                  <th className="px-4 py-2 font-medium">Prestador</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Motivo</th>
                  <th className="px-4 py-2 text-right font-medium">Procedimentos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {overview.appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-4 py-2 text-[var(--text-secondary)]">{appointment.scheduledAtLabel}</td>
                    <td className="px-4 py-2 text-[var(--text-muted)]">{appointment.providerName}</td>
                    <td className="px-4 py-2">
                      <StatusBadge value={appointment.status} map="appointment" />
                    </td>
                    <td className="px-4 py-2 text-[var(--text-muted)]">{appointment.reason ?? "—"}</td>
                    <td className="px-4 py-2 text-right text-[var(--text-secondary)]">{appointment.usagesCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Procedimentos realizados</h3>
          <ExportButtons
            baseUrl={`/api/interno/patients/${patientId}/export`}
            query={{ section: "usages" }}
          />
        </div>
        {overview.usages.length === 0 ? (
          <p className="mt-3 rounded-lg bg-[var(--surface-card)] p-4 text-[var(--text-muted)]">Nenhum procedimento registrado.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-2 font-medium">Procedimento</th>
                  <th className="px-4 py-2 font-medium">Atendimento</th>
                  <th className="px-4 py-2 font-medium">Realizado em</th>
                  <th className="px-4 py-2 font-medium">Faturado</th>
                  <th className="px-4 py-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {overview.usages.map((usage) => (
                  <tr key={usage.id}>
                    <td className="px-4 py-2">
                      <p className="font-medium text-[var(--text-secondary)]">{usage.procedure}</p>
                      <p className="text-xs text-[var(--text-muted)]">{usage.category}</p>
                    </td>
                    <td className="px-4 py-2 text-[var(--text-muted)]">{usage.appointmentDateLabel}</td>
                    <td className="px-4 py-2 text-[var(--text-muted)]">{usage.performedAtLabel}</td>
                    <td className="px-4 py-2">
                      <StatusBadge value={usage.billed ? "PAGA" : "ABERTA"} map="invoice" />
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-[var(--text-primary)]">{usage.priceLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Prontuário eletrônico ({summary.totalRecords})
          </h3>
          <ExportButtons
            baseUrl={`/api/interno/patients/${patientId}/export`}
            query={{ section: "records" }}
          />
        </div>
        {overview.medicalRecords.length === 0 ? (
          <p className="mt-3 rounded-lg bg-[var(--surface-card)] p-4 text-[var(--text-muted)]">Nenhuma anotação clínica.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {overview.medicalRecords.map((record) => (
              <article
                key={record.id}
                className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                  <span>{record.providerName}</span>
                  <div className="flex items-center gap-2">
                    <span>{record.createdAtLabel}</span>
                    <ExportButtons
                      baseUrl={`/api/interno/patients/${patientId}/records/${record.id}/export`}
                      formats={["pdf"]}
                      variant="ghost"
                    />
                  </div>
                </div>
                {record.appointmentDateLabel && (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Atendimento: {record.appointmentDateLabel}
                  </p>
                )}
                <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{record.content}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Faturas</h3>
          <ExportButtons
            baseUrl={`/api/interno/patients/${patientId}/export`}
            query={{ section: "invoices" }}
          />
        </div>
        {overview.invoices.length === 0 ? (
          <p className="mt-3 rounded-lg bg-[var(--surface-card)] p-4 text-[var(--text-muted)]">Nenhuma fatura emitida.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {overview.invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{invoice.totalLabel}</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {invoice.createdAtLabel} · {invoice.company ?? "Particular"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={invoice.status} map="invoice" />
                    <ExportButtons
                      baseUrl={`/api/interno/invoices/${invoice.id}/export`}
                      formats={["pdf", "xlsx"]}
                      variant="ghost"
                    />
                  </div>
                </div>
                <ul className="mt-3 divide-y divide-[var(--border-default)] border-t border-[var(--border-default)]">
                  {invoice.items.map((item) => (
                    <li key={item.id} className="flex justify-between py-2 text-sm">
                      <span className="text-[var(--text-secondary)]">{item.description}</span>
                      <span className="text-[var(--text-muted)]">{item.amountLabel}</span>
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
