"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [providerConfigured, setProviderConfigured] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    patientId: "",
    channel: "WHATSAPP",
    template: "APPOINTMENT_REMINDER",
    subject: "",
    body: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/interno/messages");
    const data = await res.json();
    setMessages(data.messages ?? []);
    setPatients(data.patients ?? []);
    setProviderConfigured(data.providerConfigured ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/interno/messages");
      const data = await res.json();
      if (!active) return;
      setMessages(data.messages ?? []);
      setPatients(data.patients ?? []);
      setProviderConfigured(data.providerConfigured ?? null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function loadTemplateSuggestion(patientId: string, template: string) {
    if (!patientId || template === "GENERIC") return;
    const res = await fetch(
      `/api/interno/messages/template?patientId=${patientId}&template=${template}`,
    );
    const data = await res.json();
    if (res.ok && data.suggestion) {
      setForm((prev) => ({
        ...prev,
        subject: data.suggestion.subject ?? "",
        body: data.suggestion.body ?? prev.body,
      }));
    }
  }

  async function queueMessage(e: React.FormEvent) {
    e.preventDefault();
    setBusy("create");
    setMsg(null);
    try {
      const res = await fetch("/api/interno/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: form.patientId,
          channel: form.channel,
          template: form.template,
          subject: form.subject || null,
          body: form.body,
        }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao enfileirar mensagem");
      else {
        setMsg(`Mensagem enfileirada para ${data.message.patientName}`);
        await load();
      }
    } finally {
      setBusy(null);
    }
  }

  async function dispatchMessage(id: string, patientName: string) {
    setBusy(`dispatch-${id}`);
    setMsg(null);
    try {
      const res = await fetch(`/api/interno/messages/${id}/dispatch`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao despachar");
      else {
        setMsg(`${data.message.channelLabel} enviado para ${patientName}`);
        await load();
      }
    } finally {
      setBusy(null);
    }
  }

  async function cancelMessage(id: string) {
    setBusy(`cancel-${id}`);
    setMsg(null);
    try {
      const res = await fetch(`/api/interno/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao cancelar");
      else await load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <LoadingState message="Carregando comunicações..." />;

  return (
    <div className="space-y-8">
      {!providerConfigured && (
        <Alert tone="warning">
          Nenhum provedor de comunicação configurado (<code>COMMUNICATION_PROVIDER</code>).
          Mensagens podem ser enfileiradas; o dispatch exige adapter (SendGrid, Twilio ou Meta).
          Veja <code>docs/COMMUNICATIONS.md</code>.
        </Alert>
      )}

      {msg && <Alert tone="info">{msg}</Alert>}

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
            <Button type="submit" variant="portal" disabled={busy === "create"}>
              {busy === "create" ? "Enfileirando..." : "Enfileirar mensagem"}
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
                          disabled={busy === `dispatch-${message.id}`}
                          onClick={() => dispatchMessage(message.id, message.patientName)}
                        >
                          {busy === `dispatch-${message.id}` ? "Enviando..." : "Despachar"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={busy === `cancel-${message.id}`}
                          onClick={() => cancelMessage(message.id)}
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
  );
}
