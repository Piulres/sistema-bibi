"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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

  if (loading) return <p className="text-slate-500">Carregando comunicações...</p>;

  return (
    <div className="space-y-8">
      {!providerConfigured && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Nenhum provedor de comunicação configurado (<code>COMMUNICATION_PROVIDER</code>).
          Mensagens podem ser enfileiradas; o dispatch exige adapter (SendGrid, Twilio ou Meta).
          Veja <code>docs/COMMUNICATIONS.md</code>.
        </p>
      )}

      {msg && (
        <p className="rounded-lg bg-indigo-50 px-4 py-2 text-sm text-indigo-800">{msg}</p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Nova comunicação</h2>
        <form onSubmit={queueMessage} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-600">Beneficiário</span>
            <select
              required
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
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
            <span className="text-slate-600">Canal</span>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
              value={form.channel}
              onChange={(e) => setForm({ ...form, channel: e.target.value })}
            >
              <option value="EMAIL">E-mail</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600">Template</span>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
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
              <span className="text-slate-600">Assunto</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </label>
          )}
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600">Mensagem</span>
            <textarea
              required
              rows={4}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy === "create"}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {busy === "create" ? "Enfileirando..." : "Enfileirar mensagem"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Fila de comunicações</h2>
        {messages.length === 0 ? (
          <p className="mt-4 rounded-lg bg-white p-4 text-slate-500">Nenhuma mensagem registrada.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {messages.map((message) => (
              <article
                key={message.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/interno/beneficiarios/${message.patientId}?from=/interno/comunicacao`}
                      className="font-semibold text-indigo-700 hover:underline"
                    >
                      {message.patientName}
                    </Link>
                    <p className="text-sm text-slate-500">
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
                        <button
                          type="button"
                          disabled={busy === `dispatch-${message.id}`}
                          onClick={() => dispatchMessage(message.id, message.patientName)}
                          className="rounded-lg border border-indigo-200 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                        >
                          {busy === `dispatch-${message.id}` ? "Enviando..." : "Despachar"}
                        </button>
                        <button
                          type="button"
                          disabled={busy === `cancel-${message.id}`}
                          onClick={() => cancelMessage(message.id)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
