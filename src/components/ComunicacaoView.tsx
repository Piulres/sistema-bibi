"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { fetchJson } from "@/lib/ui/api-feedback";
import { confirmPresets } from "@/lib/ui/confirm-presets";

type Message = {
  id: string;
  channelLabel: string;
  templateLabel: string;
  subject: string | null;
  body: string;
  status: string;
  statusLabel: string;
  createdAtLabel: string;
  sentAtLabel: string | null;
  patientId: string;
  patientName: string;
};

type Patient = { id: string; name: string; phone: string | null };

export default function ComunicacaoView() {
  const { isBusy, run, showToast } = useAsyncAction();
  const [form, setForm] = useState({
    patientId: "",
    channel: "WHATSAPP",
    template: "APPOINTMENT_REMINDER",
    subject: "",
    body: "",
  });

  const loadMessages = useCallback(
    () =>
      fetchJson<{
        messages?: Message[];
        patients?: Patient[];
        providerConfigured?: string | null;
      }>("/api/interno/messages", undefined, "Erro ao carregar comunicações"),
    [],
  );

  const { data, loading, error, reload } = useAsyncData(loadMessages, [], {
    forbiddenMessage: "Sem permissão para acessar comunicações",
  });

  const messages = data?.messages ?? [];
  const patients = data?.patients ?? [];
  const providerConfigured = data?.providerConfigured ?? null;

  async function loadTemplateSuggestion(patientId: string, template: string) {
    if (!patientId || template === "GENERIC") return;
    const res = await fetch(
      `/api/interno/messages/template?patientId=${patientId}&template=${template}`,
    );
    const body = await res.json();
    if (res.ok && body.suggestion) {
      setForm((prev) => ({
        ...prev,
        subject: body.suggestion.subject ?? "",
        body: body.suggestion.body ?? prev.body,
      }));
    }
  }

  async function queueMessage(e: React.FormEvent) {
    e.preventDefault();
    await run(
      "create",
      () =>
        fetch("/api/interno/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: form.patientId,
            channel: form.channel,
            template: form.template,
            subject: form.subject || null,
            body: form.body,
          }),
        }),
      {
        silentSuccess: true,
        errorMessage: "Erro ao enfileirar mensagem",
        onSuccess: async (body) => {
          const message = body.message as { patientName?: string } | undefined;
          showToast({
            message: `Mensagem enfileirada para ${message?.patientName ?? "beneficiário"}`,
            tone: "success",
          });
          await reload();
        },
      },
    );
  }

  async function dispatchMessage(id: string, patientName: string) {
    await run(
      `dispatch-${id}`,
      () => fetch(`/api/interno/messages/${id}/dispatch`, { method: "POST" }),
      {
        silentSuccess: true,
        errorMessage: "Erro ao despachar",
        onSuccess: async (body) => {
          const message = body.message as { channelLabel?: string } | undefined;
          showToast({
            message: `${message?.channelLabel ?? "Mensagem"} enviado para ${patientName}`,
            tone: "success",
          });
          await reload();
        },
      },
    );
  }

  async function cancelMessage(id: string, patientName: string) {
    await run(
      `cancel-${id}`,
      () =>
        fetch(`/api/interno/messages/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cancel" }),
        }),
      {
        confirm: confirmPresets.cancelMessage(patientName),
        successMessage: "Mensagem cancelada",
        onSuccess: () => { void reload(); },
      },
    );
  }

  async function runReminders() {
    await run(
      "reminders",
      () =>
        fetch("/api/interno/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ autoDispatch: true }),
        }),
      {
        silentSuccess: true,
        errorMessage: "Erro ao gerar lembretes",
        onSuccess: async (body) => {
          const r = body.result as {
            appointments?: number;
            subscriptionCharges?: number;
            invoiceDue?: number;
            dispatched?: number;
          };
          showToast({
            message: `Lembretes: ${r.appointments ?? 0} consulta(s), ${r.subscriptionCharges ?? 0} assinatura(s), ${r.invoiceDue ?? 0} fatura(s) — ${r.dispatched ?? 0} enviado(s)`,
            tone: "info",
          });
          await reload();
        },
      },
    );
  }

  return (
    <ViewStateBoundary
      loading={loading}
      error={error}
      loadingMessage="Carregando comunicações..."
      onRetry={() => void reload()}
    >
      <div className="space-y-8">
        {!providerConfigured && (
          <Alert tone="warning">
            Nenhum provedor de comunicação configurado. Defina COMMUNICATION_PROVIDER=console no .env
            para dispatch em modo POC.
          </Alert>
        )}

        <Card>
          <SectionHeader
            title="Automação de lembretes"
            description="Enfileira lembretes de consulta (24h), cobranças de assinatura (3 dias) e procedimentos pendentes."
          />
          <div className="mt-4">
            <Button variant="portal" disabled={isBusy("reminders")} onClick={runReminders}>
              {isBusy("reminders") ? "Processando..." : "Gerar lembretes automáticos"}
            </Button>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Nova comunicação" />
          <form onSubmit={queueMessage} className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Beneficiário</span>
              <select
                required
                className="mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2"
                value={form.patientId}
                onChange={(e) => {
                  const patientId = e.target.value;
                  setForm({ ...form, patientId });
                  void loadTemplateSuggestion(patientId, form.template);
                }}
              >
                <option value="">Selecione...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.phone ? ` · ${p.phone}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Canal</span>
              <select
                className="mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2"
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
              >
                <option value="EMAIL">E-mail</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-[var(--text-secondary)]">Template</span>
              <select
                className="mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2"
                value={form.template}
                onChange={(e) => {
                  const template = e.target.value;
                  setForm({ ...form, template });
                  void loadTemplateSuggestion(form.patientId, template);
                }}
              >
                <option value="APPOINTMENT_REMINDER">Lembrete de consulta</option>
                <option value="INVOICE_DUE">Fatura pendente</option>
                <option value="SUBSCRIPTION_DUE">Cobrança recorrente</option>
                <option value="GENERIC">Mensagem livre</option>
              </select>
            </label>
            {form.channel === "EMAIL" && (
              <label className="block text-sm sm:col-span-2">
                <span className="text-[var(--text-secondary)]">Assunto</span>
                <input
                  className="mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] px-3 py-2"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </label>
            )}
            <label className="block text-sm sm:col-span-2">
              <span className="text-[var(--text-secondary)]">Mensagem</span>
              <textarea
                required
                rows={4}
                className="mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] px-3 py-2"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" variant="portal" disabled={isBusy("create")}>
                {isBusy("create") ? "Enfileirando..." : "Enfileirar mensagem"}
              </Button>
            </div>
          </form>
        </Card>

        <section>
          <SectionHeader title="Fila de comunicações" />
          {messages.length === 0 ? (
            <EmptyState message="Nenhuma mensagem registrada." />
          ) : (
            <div className="mt-4 space-y-4">
              {messages.map((message) => (
                <Card key={message.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/interno/beneficiarios/${message.patientId}?from=/interno/comunicacao`}
                        className="font-semibold text-[var(--portal-accent)] hover:underline"
                      >
                        {message.patientName}
                      </Link>
                      <p className="text-sm text-[var(--text-muted)]">
                        {message.channelLabel} · {message.templateLabel} · {message.statusLabel}
                      </p>
                      {message.subject && (
                        <p className="mt-1 text-sm font-medium text-slate-700">{message.subject}</p>
                      )}
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{message.body}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        Criada em {message.createdAtLabel}
                        {message.sentAtLabel ? ` · Enviada em ${message.sentAtLabel}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {message.status === "PENDENTE" && (
                        <>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={isBusy(`dispatch-${message.id}`)}
                            onClick={() => dispatchMessage(message.id, message.patientName)}
                          >
                            {isBusy(`dispatch-${message.id}`) ? "Enviando..." : "Despachar"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isBusy(`cancel-${message.id}`)}
                            onClick={() => cancelMessage(message.id, message.patientName)}
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </ViewStateBoundary>
  );
}
