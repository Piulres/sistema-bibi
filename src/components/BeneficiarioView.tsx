"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingState from "@/components/ui/LoadingState";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

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
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pixState, setPixState] = useState<{
    invoiceId: string;
    paymentId: string;
    pixCopyPaste: string;
  } | null>(null);

  const reload = async () => {
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
          pixCopyPaste: data.pixCopyPaste ?? data.payment.pixCopyPaste,
        });
        setMsg("PIX gerado — copie o código e confirme após pagar");
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
      if (!res.ok) setMsg(data.error ?? "Erro ao confirmar pagamento");
      else {
        setMsg("Pagamento confirmado. Obrigado!");
        setPixState(null);
        await reload();
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

  return (
    <div className="space-y-8">
      {msg && <Alert tone="info">{msg}</Alert>}

      {pixState && (
        <Alert tone="info">
          <p className="font-medium">Pague via PIX</p>
          <p className="mt-2 break-all font-mono text-xs">{pixState.pixCopyPaste}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="portal"
              size="sm"
              disabled={busy === `confirm-${pixState.invoiceId}`}
              onClick={() => confirmPix(pixState.invoiceId, pixState.paymentId)}
            >
              {busy === `confirm-${pixState.invoiceId}` ? "Confirmando..." : "Já paguei — confirmar"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPixState(null)}>
              Fechar
            </Button>
          </div>
        </Alert>
      )}

      <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-sm">
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
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm">
          <p className="text-sm text-[var(--text-muted)]">Próximo atendimento</p>
          <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
            {nextAppointment?.scheduledAtLabel ?? "Nenhum agendado"}
          </p>
          {nextAppointment && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {nextAppointment.providerName} · {nextAppointment.reason ?? "Consulta"}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm">
          <p className="text-sm text-[var(--text-muted)]">Pendente (Pay Per Use)</p>
          <p className="mt-1 text-lg font-semibold text-amber-700">{summary.pendingAmountLabel}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm">
          <p className="text-sm text-[var(--text-muted)]">Total faturado</p>
          <p className="mt-1 text-lg font-semibold text-indigo-700">{summary.totalInvoicedLabel}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm">
          <p className="text-sm text-[var(--text-muted)]">Assinatura</p>
          <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
            {activeSubscription?.billingCycleLabel ?? "Sem plano ativo"}
          </p>
          {activeSubscription && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">{activeSubscription.amountLabel}/ciclo</p>
          )}
        </div>
      </div>

      <section>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Minha agenda</h3>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Meu consumo (Pay Per Use)</h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Transparência prévia — você paga apenas pelo que foi utilizado.
        </p>
        {overview.usages.length === 0 ? (
          <p className="mt-3 rounded-lg bg-[var(--surface-card)] p-4 text-[var(--text-muted)]">Nenhum procedimento registrado.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm">
            <table className="w-full text-left text-sm">
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

      <section>
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

      <section>
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

      <section>
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

      <section>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Histórico de atividades</h3>
        {overview.timeline.length === 0 ? (
          <p className="mt-3 rounded-lg bg-[var(--surface-card)] p-4 text-[var(--text-muted)]">Nenhum evento registrado.</p>
        ) : (
          <ol className="relative mt-4 space-y-0 border-l border-teal-200 pl-6">
            {overview.timeline.slice(0, 10).map((event) => (
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
    </div>
  );
}
