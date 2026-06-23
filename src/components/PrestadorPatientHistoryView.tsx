"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingState from "@/components/ui/LoadingState";
import Alert from "@/components/ui/Alert";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ExportButtons from "@/components/ExportButtons";
import { buildPatientHistoryBreadcrumbs } from "@/lib/navigation";
import ClinicalSidebar, { type ClinicalSidebarData } from "@/components/clinical/ClinicalSidebar";
import TabBar from "@/components/ui/TabBar";
import ClinicalCarePanel from "@/components/clinical/ClinicalCarePanel";
import Card from "@/components/ui/Card";

type Overview = {
  patient: {
    id: string;
    name: string;
    cpf: string;
    birthDateLabel: string;
    phone: string | null;
    company: string | null;
  };
  summary: {
    totalAppointments: number;
    totalUsages: number;
    totalRecords: number;
    lastVisitLabel: string | null;
    nextVisitLabel: string | null;
  };
  appointments: {
    id: string;
    scheduledAtLabel: string;
    status: string;
    modality: string;
    reason: string | null;
    usagesCount: number;
  }[];
  usages: {
    id: string;
    procedure: string;
    category: string;
    performedAtLabel: string;
    appointmentDateLabel: string;
    appointmentId: string;
  }[];
  medicalRecords: {
    id: string;
    content: string;
    recordType: string;
    title: string | null;
    createdAtLabel: string;
    appointmentDateLabel: string | null;
    appointmentId: string | null;
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

export default function PrestadorPatientHistoryView({ patientId }: { patientId: string }) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [clinicalSidebar, setClinicalSidebar] = useState<ClinicalSidebarData | null>(null);
  const [historyTab, setHistoryTab] = useState<"historico" | "medicacao" | "exames" | "protocolos" | "perfil">("historico");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [res, clinicalRes] = await Promise.all([
        fetch(`/api/prestador/patients/${patientId}/overview`),
        fetch(`/api/prestador/patients/${patientId}/clinical-overview`),
      ]);
      const data = await res.json();
      const clinicalData = await clinicalRes.json();
      if (!active) return;
      if (!res.ok) {
        setError(data.error ?? "Erro ao carregar histórico");
      } else {
        setOverview(data.overview);
      }
      if (clinicalRes.ok) {
        setClinicalSidebar({
          profile: clinicalData.overview.profile,
          activeMedications: clinicalData.overview.activeMedications,
          pendingExams: clinicalData.overview.pendingExams,
          activeProtocols: clinicalData.overview.activeProtocols,
        });
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [patientId]);

  if (loading) return <LoadingState message="Carregando histórico do paciente..." />;
  if (error || !overview) {
    return <Alert tone="danger">{error ?? "Paciente não encontrado"}</Alert>;
  }

  const { patient, summary } = overview;

  return (
    <div className="space-y-8">
      <Breadcrumbs items={buildPatientHistoryBreadcrumbs(patient.name)} />

      <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{patient.name}</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">CPF {patient.cpf}</p>
            <p className="text-sm text-[var(--text-muted)]">
              Nascimento: {patient.birthDateLabel}
              {patient.phone ? ` · Tel. ${patient.phone}` : ""}
            </p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {patient.company ? `Empresa: ${patient.company}` : "Particular"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <ExportButtons
              baseUrl={`/api/prestador/patients/${patientId}/export`}
              query={{ section: "summary" }}
            />
            <div className="text-right text-sm text-[var(--text-muted)]">
              {summary.lastVisitLabel && <p>Última consulta: {summary.lastVisitLabel}</p>}
              {summary.nextVisitLabel && <p>Próxima consulta: {summary.nextVisitLabel}</p>}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm">
          <p className="text-sm text-[var(--text-muted)]">Atendimentos comigo</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{summary.totalAppointments}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm">
          <p className="text-sm text-[var(--text-muted)]">Procedimentos realizados</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{summary.totalUsages}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm">
          <p className="text-sm text-[var(--text-muted)]">Registros no prontuário</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{summary.totalRecords}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <ClinicalSidebar data={clinicalSidebar} />

        <div className="space-y-4">
          <TabBar
            tabs={[
              { key: "historico", label: "Histórico" },
              { key: "medicacao", label: "Medicação" },
              { key: "exames", label: "Exames" },
              { key: "protocolos", label: "Protocolos" },
              { key: "perfil", label: "Perfil clínico" },
            ]}
            active={historyTab}
            onSelect={(k) => setHistoryTab(k as typeof historyTab)}
          />

          {historyTab === "historico" && (
            <>
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Histórico de atendimentos</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Todas as consultas deste paciente com você, do mais recente ao mais antigo.
            </p>
          </div>
          <ExportButtons
            baseUrl={`/api/prestador/patients/${patientId}/export`}
            query={{ section: "appointments" }}
          />
        </div>
        {overview.appointments.length === 0 ? (
          <p className="mt-3 rounded-lg bg-[var(--surface-card)] p-4 text-[var(--text-muted)]">
            Nenhum atendimento registrado.
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-2 font-medium">Data</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Motivo</th>
                  <th className="px-4 py-2 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {overview.appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-4 py-2 text-[var(--text-secondary)]">
                      {appointment.scheduledAtLabel}
                      {appointment.modality === "TELE" && (
                        <span className="ml-2 text-xs text-[var(--status-info-text)]">Tele</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge value={appointment.status} map="appointment" />
                    </td>
                    <td className="px-4 py-2 text-[var(--text-muted)]">{appointment.reason ?? "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/prestador/atendimento/${appointment.id}`}
                        className="text-[var(--portal-accent)] hover:underline"
                      >
                        Abrir
                        {appointment.usagesCount > 0 ? ` (${appointment.usagesCount} proc.)` : ""}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Procedimentos realizados</h2>
          <ExportButtons
            baseUrl={`/api/prestador/patients/${patientId}/export`}
            query={{ section: "usages" }}
          />
        </div>
        {overview.usages.length === 0 ? (
          <p className="mt-3 rounded-lg bg-[var(--surface-card)] p-4 text-[var(--text-muted)]">
            Nenhum procedimento registrado.
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-2 font-medium">Procedimento</th>
                  <th className="px-4 py-2 font-medium">Atendimento</th>
                  <th className="px-4 py-2 font-medium">Realizado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {overview.usages.map((usage) => (
                  <tr key={usage.id}>
                    <td className="px-4 py-2">
                      <p className="font-medium text-[var(--text-secondary)]">{usage.procedure}</p>
                      <p className="text-xs text-[var(--text-muted)]">{usage.category}</p>
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/prestador/atendimento/${usage.appointmentId}`}
                        className="text-[var(--portal-accent)] hover:underline"
                      >
                        {usage.appointmentDateLabel}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-[var(--text-muted)]">{usage.performedAtLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Prontuário eletrônico ({summary.totalRecords})
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Evoluções, anamneses e demais registros clínicos dos seus atendimentos.
            </p>
          </div>
          <ExportButtons
            baseUrl={`/api/prestador/patients/${patientId}/export`}
            query={{ section: "records" }}
          />
        </div>
        {overview.medicalRecords.length === 0 ? (
          <p className="mt-3 rounded-lg bg-[var(--surface-card)] p-4 text-[var(--text-muted)]">
            Nenhuma anotação clínica.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {overview.medicalRecords.map((record) => (
              <article
                key={record.id}
                className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                  <StatusBadge value={record.recordType} map="timeline" />
                  <div className="flex items-center gap-2">
                    <span>{record.createdAtLabel}</span>
                    <ExportButtons
                      baseUrl={`/api/prestador/records/${record.id}/export`}
                      formats={["pdf"]}
                      variant="ghost"
                    />
                  </div>
                </div>
                {record.title && (
                  <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{record.title}</p>
                )}
                {record.appointmentDateLabel && record.appointmentId && (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Atendimento:{" "}
                    <Link
                      href={`/prestador/atendimento/${record.appointmentId}`}
                      className="text-[var(--portal-accent)] hover:underline"
                    >
                      {record.appointmentDateLabel}
                    </Link>
                  </p>
                )}
                <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
                  {record.content}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {overview.timeline.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Linha do tempo</h2>
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
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
            </>
          )}

          {["medicacao", "exames", "protocolos", "perfil"].includes(historyTab) && (
            <Card padding="lg">
              <ClinicalCarePanel
                patientId={patientId}
                tab={historyTab as "medicacao" | "exames" | "protocolos" | "perfil"}
                onChanged={async () => {
                  const clinicalRes = await fetch(`/api/prestador/patients/${patientId}/clinical-overview`);
                  const clinicalData = await clinicalRes.json();
                  if (clinicalRes.ok) {
                    setClinicalSidebar({
                      profile: clinicalData.overview.profile,
                      activeMedications: clinicalData.overview.activeMedications,
                      pendingExams: clinicalData.overview.pendingExams,
                      activeProtocols: clinicalData.overview.activeProtocols,
                    });
                  }
                }}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
