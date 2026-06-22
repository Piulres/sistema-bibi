"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingState from "@/components/ui/LoadingState";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";
import StatCard from "@/components/ui/StatCard";
import FlowStepper from "@/components/ui/FlowStepper";
import AppointmentCard from "@/components/ui/AppointmentCard";
import PixQrDisplay from "@/components/ui/PixQrDisplay";
import { CARE_JOURNEY_STEPS, resolveCareJourneyStep } from "@/lib/care-journey";

export type BeneficiarioSection =
  | "agendar"
  | "resumo"
  | "agenda"
  | "consumo"
  | "faturas"
  | "assinatura"
  | "prontuario"
  | "historico";

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
    scheduledAt: string;
    scheduledAtLabel: string;
    status: string;
    modality: string;
    telemedicineUrl: string | null;
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

type PixState = {
  invoiceId: string;
  paymentId: string;
  pixCopyPaste: string;
};

export default function BeneficiarioView({ section }: { section?: BeneficiarioSection }) {
  const show = (id: BeneficiarioSection) => !section || section === id;
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pixState, setPixState] = useState<PixState | null>(null);
  const [providers, setProviders] = useState<{ id: string; name: string }[]>([]);
  const [slots, setSlots] = useState<{ start: string; label: string }[]>([]);
  const [scheduleForm, setScheduleForm] = useState({
    providerId: "",
    date: new Date().toISOString().slice(0, 10),
    slot: "",
    reason: "Consulta de rotina",
    modality: "PRESENCIAL",
  });

  const reloadOverview = async () => {
    const res = await fetch("/api/beneficiario/overview");
    const data = await res.json();
    if (res.ok) setOverview(data.overview);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const [overviewRes, providersRes] = await Promise.all([
        fetch("/api/beneficiario/overview"),
        fetch("/api/beneficiario/providers"),
      ]);
      const overviewData = await overviewRes.json();
      const providersData = await providersRes.json();
      if (!active) return;
      if (!overviewRes.ok) setError(overviewData.error ?? "Erro ao carregar seus dados");
      else setOverview(overviewData.overview);
      setProviders(providersData.providers ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!scheduleForm.providerId || !scheduleForm.date) {
        if (active) setSlots([]);
        return;
      }
      const res = await fetch(
        `/api/beneficiario/slots?providerId=${scheduleForm.providerId}&date=${scheduleForm.date}`,
      );
      const data = await res.json();
      if (!active) return;
      setSlots(data.slots ?? []);
      setScheduleForm((prev) => ({ ...prev, slot: "" }));
    })();
    return () => {
      active = false;
    };
  }, [scheduleForm.providerId, scheduleForm.date]);

  async function bookAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduleForm.slot) return;
    setBusy("book");
    setMsg(null);
    try {
      const res = await fetch("/api/beneficiario/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: scheduleForm.providerId,
          scheduledAt: scheduleForm.slot,
          reason: scheduleForm.reason,
          modality: scheduleForm.modality,
        }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao agendar");
      else {
        setMsg("Consulta agendada! Aguarde confirmação da clínica.");
        await reloadOverview();
      }
    } finally {
      setBusy(null);
    }
  }

  async function cancelAppointment(id: string) {
    setBusy(`cancel-${id}`);
    setMsg(null);
    try {
      const res = await fetch(`/api/beneficiario/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao cancelar");
      else {
        setMsg("Consulta cancelada com sucesso.");
        await reloadOverview();
      }
    } finally {
      setBusy(null);
    }
  }

  async function payWithPix(invoiceId: string) {
    setBusy(`pix-${invoiceId}`);
    setMsg(null);
    try {
      const res = await fetch(`/api/beneficiario/invoices/${invoiceId}/pay`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao gerar PIX");
      else {
        setPixState({
          invoiceId,
          paymentId: data.payment.id,
          pixCopyPaste: data.pixCopyPaste ?? data.payment.pixCopyPaste ?? "",
        });
        setMsg("Cobrança PIX gerada — copie o código abaixo");
      }
    } finally {
      setBusy(null);
    }
  }

  async function confirmPix(invoiceId: string, paymentId: string) {
    setBusy(`confirm-${invoiceId}`);
    setMsg(null);
    try {
      const res = await fetch(`/api/beneficiario/invoices/${invoiceId}/pay`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao confirmar PIX");
      else {
        setMsg("Pagamento PIX confirmado");
        setPixState(null);
        await reloadOverview();
      }
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <LoadingState message="Carregando seu painel..." />;
  if (error || !overview) {
    return <Alert tone="danger">{error ?? "Dados indisponíveis"}</Alert>;
  }

  const { patient, summary, nextAppointment } = overview;
  const activeSubscription = overview.subscriptions.find((s) => s.status === "ATIVA");
  const journeyStep = resolveCareJourneyStep({
    appointmentStatus: nextAppointment?.status,
    hasUnbilledUsages: overview.usages.some((u) => !u.billed),
    hasOpenInvoice: overview.invoices.some((i) => i.status !== "PAGA"),
    hasPaidInvoice: overview.invoices.some((i) => i.status === "PAGA"),
  });

  return (
    <div className="space-y-8">
      {msg && (show("agendar") || show("agenda") || show("faturas")) && (
        <Alert tone="info">{msg}</Alert>
      )}
      {pixState && show("faturas") && (
        <Alert tone="info">
          <p className="font-medium">PIX gerado</p>
          <PixQrDisplay copyPaste={pixState.pixCopyPaste} className="mt-3" />
          <Button
            className="mt-3"
            variant="portal"
            size="sm"
            disabled={busy === `confirm-${pixState.invoiceId}`}
            onClick={() => confirmPix(pixState.invoiceId, pixState.paymentId)}
          >
            {busy === `confirm-${pixState.invoiceId}` ? "Confirmando..." : "Confirmar pagamento PIX"}
          </Button>
        </Alert>
      )}

      {show("agendar") && (
      <section id="agendar">
      <Card>
        <SectionHeader
          title="Agendar consulta"
          description="Escolha prestador, data e horário disponível. A clínica confirma o agendamento."
        />
        <form onSubmit={bookAppointment} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Prestador</span>
            <select
              required
              className="mt-1 w-full rounded border px-3 py-2"
              value={scheduleForm.providerId}
              onChange={(e) => setScheduleForm({ ...scheduleForm, providerId: e.target.value })}
            >
              <option value="">Selecione...</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Data</span>
            <input
              required
              type="date"
              className="mt-1 w-full rounded border px-3 py-2"
              value={scheduleForm.date}
              onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Horário</span>
            <select
              required
              className="mt-1 w-full rounded border px-3 py-2"
              value={scheduleForm.slot}
              onChange={(e) => setScheduleForm({ ...scheduleForm, slot: e.target.value })}
            >
              <option value="">{slots.length ? "Selecione..." : "Sem horários"}</option>
              {slots.map((s) => (
                <option key={s.start} value={s.start}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Modalidade</span>
            <select
              className="mt-1 w-full rounded border px-3 py-2"
              value={scheduleForm.modality}
              onChange={(e) => setScheduleForm({ ...scheduleForm, modality: e.target.value })}
            >
              <option value="PRESENCIAL">Presencial</option>
              <option value="TELE">Telemedicina</option>
            </select>
          </label>
          <div className="flex items-end">
            <Button type="submit" variant="portal" disabled={busy === "book" || !scheduleForm.slot}>
              {busy === "book" ? "Agendando..." : "Agendar"}
            </Button>
          </div>
        </form>
      </Card>
      </section>
      )}

      {show("resumo") && (
      <section id="resumo" className="space-y-4">
      <Card padding="sm">
        <FlowStepper steps={[...CARE_JOURNEY_STEPS]} currentStepId={journeyStep} className="mb-4" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">{patient.name}</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">CPF {patient.cpf}</p>
        <p className="text-sm text-[var(--text-muted)]">
          Nascimento: {patient.birthDateLabel}
          {patient.phone ? ` · Tel. ${patient.phone}` : ""}
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {patient.company
            ? `Plano corporativo: ${patient.company.name}`
            : "Atendimento particular"}
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Próximo atendimento"
          value={nextAppointment?.scheduledAtLabel ?? "Nenhum"}
          hint={
            nextAppointment
              ? `${nextAppointment.providerName} · ${nextAppointment.reason ?? "Consulta"}`
              : undefined
          }
          info="Data e horário da sua próxima consulta confirmada ou agendada."
        />
        <StatCard
          label="Consultas"
          value={summary.totalAppointments}
          info="Total de consultas registradas na clínica."
        />
        <StatCard
          label="Procedimentos"
          value={summary.totalUsages}
          info="Procedimentos Pay Per Use já utilizados."
        />
        <StatCard
          label="Pendente (Pay Per Use)"
          value={summary.pendingAmountLabel}
          tone="warning"
          info="Valor de procedimentos utilizados ainda não faturados."
        />
        <StatCard
          label="Total faturado"
          value={summary.totalInvoicedLabel}
          tone="accent"
          info="Soma das faturas já emitidas para você."
        />
        <StatCard
          label="Assinatura"
          value={activeSubscription?.billingCycleLabel ?? "Sem plano ativo"}
          hint={activeSubscription ? `${activeSubscription.amountLabel}/ciclo` : undefined}
          info="Plano recorrente ativo, se houver."
        />
      </div>
      </section>
      )}

      {show("agenda") && (
      <section id="agenda">
        <SectionHeader
          title="Minha agenda"
          description="Consultas agendadas e histórico recente."
        />
        {overview.appointments.length === 0 ? (
          <p className="mt-3 rounded-lg bg-[var(--surface-card)] p-4 text-[var(--text-muted)]">
            Nenhum atendimento registrado.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {overview.appointments.map((appointment) => {
              const time = new Date(appointment.scheduledAt).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const canCancel = appointment.status === "AGENDADO";
              return (
                <AppointmentCard
                  key={appointment.id}
                  time={time}
                  title={appointment.providerName}
                  subtitle={appointment.scheduledAtLabel}
                  status={appointment.status}
                  meta={
                    appointment.modality === "TELE" && appointment.telemedicineUrl ? (
                      <a
                        href={appointment.telemedicineUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[var(--portal-accent)] hover:underline"
                      >
                        Entrar na teleconsulta
                      </a>
                    ) : appointment.reason ? (
                      <span className="text-xs text-[var(--text-muted)]">{appointment.reason}</span>
                    ) : null
                  }
                  actions={
                    canCancel ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busy === `cancel-${appointment.id}`}
                        onClick={() => cancelAppointment(appointment.id)}
                      >
                        {busy === `cancel-${appointment.id}` ? "Cancelando..." : "Cancelar"}
                      </Button>
                    ) : null
                  }
                />
              );
            })}
          </div>
        )}
      </section>
      )}

      {show("consumo") && (
      <section id="consumo">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Meu consumo (Pay Per Use)</h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Transparência prévia — você paga apenas pelo que foi utilizado.
        </p>
        {overview.usages.length === 0 ? (
          <p className="mt-3 rounded-lg bg-[var(--surface-card)] p-4 text-[var(--text-muted)]">Nenhum procedimento registrado.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-2 font-medium">Procedimento</th>
                  <th className="px-4 py-2 font-medium">Atendimento</th>
                  <th className="px-4 py-2 font-medium">Situação</th>
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
      )}

      {show("faturas") && (
      <section id="faturas">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Minhas faturas</h3>
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
                    <p className="text-sm text-[var(--text-muted)]">{invoice.createdAtLabel}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={invoice.status} map="invoice" />
                    {invoice.status === "FECHADA" && (
                      <Button
                        variant="portal"
                        size="sm"
                        disabled={busy === `pix-${invoice.id}`}
                        onClick={() => payWithPix(invoice.id)}
                      >
                        {busy === `pix-${invoice.id}` ? "..." : "Pagar com PIX"}
                      </Button>
                    )}
                  </div>
                </div>
                <ul className="mt-3 divide-y divide-[var(--border-default)] border-t border-slate-100">
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
      )}

      {show("assinatura") && (
      <section id="assinatura">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Minha assinatura</h3>
        {overview.subscriptions.length === 0 ? (
          <p className="mt-3 rounded-lg bg-[var(--surface-card)] p-4 text-[var(--text-muted)]">
            Você não possui assinatura recorrente.
          </p>
        ) : (
          <div className="mt-3 space-y-4">
            {overview.subscriptions.map((sub) => (
              <article
                key={sub.id}
                className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">
                      {sub.billingCycleLabel} · {sub.amountLabel}
                    </p>
                    {sub.description && (
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{sub.description}</p>
                    )}
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      {sub.pendingCharges} cobrança(s) pendente(s)
                      {sub.nextDueDateLabel ? ` · próxima: ${sub.nextDueDateLabel}` : ""}
                    </p>
                  </div>
                  <StatusBadge value={sub.status} map="subscription" />
                </div>
                {sub.charges.length > 0 && (
                  <ul className="mt-4 divide-y divide-[var(--border-default)] border-t border-slate-100">
                    {sub.charges.map((charge) => (
                      <li key={charge.id} className="flex justify-between py-2 text-sm">
                        <span className="text-[var(--text-secondary)]">{charge.dueDateLabel}</span>
                        <span className="text-[var(--text-muted)]">
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
      )}

      {show("prontuario") && (
      <section id="prontuario">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Meu prontuário</h3>
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
                  <span>{record.createdAtLabel}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{record.content}</p>
              </article>
            ))}
          </div>
        )}
      </section>
      )}

      {show("historico") && (
      <section id="historico">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Histórico de atividades</h3>
        {overview.timeline.length === 0 ? (
          <p className="mt-3 rounded-lg bg-[var(--surface-card)] p-4 text-[var(--text-muted)]">Nenhum evento registrado.</p>
        ) : (
          <ol className="relative mt-4 space-y-0 border-l border-teal-200 pl-6">
            {overview.timeline.map((event) => (
              <li key={event.id} className="relative pb-6 last:pb-0">
                <span className="absolute -left-[1.625rem] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-teal-500 ring-2 ring-teal-100" />
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-sm">
                  <p className="text-xs text-[var(--text-muted)]">{event.createdAtLabel}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{event.description}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
      )}
    </div>
  );
}
