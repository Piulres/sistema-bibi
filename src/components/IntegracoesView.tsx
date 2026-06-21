"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";

type WebhookEvent =
  | "INVOICE_ISSUED"
  | "APPOINTMENT_CREATED"
  | "COMPANY_STATUS_CHANGED"
  | "PATIENT_CREATED";

type WebhookRow = {
  id: string;
  label: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;
  hasSecret: boolean;
};

const EVENT_LABELS: Record<WebhookEvent, string> = {
  INVOICE_ISSUED: "Fatura emitida",
  APPOINTMENT_CREATED: "Agendamento criado",
  COMPANY_STATUS_CHANGED: "Status da empresa alterado",
  PATIENT_CREATED: "Beneficiário cadastrado",
};

const fieldClass =
  "mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-sm";

export default function IntegracoesView() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [form, setForm] = useState({
    label: "",
    url: "",
    secret: "",
    events: [] as WebhookEvent[],
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/interno/webhooks");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erro ao carregar webhooks");
    } else {
      setWebhooks(data.webhooks ?? []);
      setEvents(data.events ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      await load();
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [load]);

  function toggleEvent(event: WebhookEvent) {
    setForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  }

  async function submitWebhook(e: React.FormEvent) {
    e.preventDefault();
    setBusy("create");
    setMsg(null);
    try {
      const res = await fetch("/api/interno/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          secret: form.secret || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro");
      else {
        setMsg(`Webhook "${data.webhook.label}" criado`);
        setForm({ label: "", url: "", secret: "", events: [] });
        await load();
      }
    } finally {
      setBusy(null);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    setBusy(id);
    try {
      const res = await fetch(`/api/interno/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (res.ok) await load();
    } finally {
      setBusy(null);
    }
  }

  async function removeWebhook(id: string) {
    setBusy(`del-${id}`);
    try {
      const res = await fetch(`/api/interno/webhooks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMsg("Webhook removido");
        await load();
      }
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <LoadingState message="Carregando integrações..." />;
  if (error) return <Alert tone="danger">{error}</Alert>;

  return (
    <div className="space-y-8">
      {msg && <Alert tone="success">{msg}</Alert>}

      <Card>
        <SectionHeader
          title="Webhooks outbound"
          description="Notificações HTTP POST com assinatura HMAC (header X-Bibi-Signature) para ERPs, RHIS e parceiros B2B."
        />
        <form onSubmit={submitWebhook} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Rótulo</span>
            <input
              required
              className={fieldClass}
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="ERP TechCorp"
            />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">URL de destino</span>
            <input
              required
              type="url"
              className={fieldClass}
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://api.parceiro.com/webhooks/bibi"
            />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Secret (opcional)</span>
            <input
              className={fieldClass}
              value={form.secret}
              onChange={(e) => setForm({ ...form, secret: e.target.value })}
              placeholder="Chave para HMAC SHA-256"
            />
          </label>
          <fieldset>
            <legend className="text-sm font-medium text-[var(--text-secondary)]">Eventos</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {events.map((event) => (
                <label key={event} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.events.includes(event)}
                    onChange={() => toggleEvent(event)}
                  />
                  {EVENT_LABELS[event]}
                </label>
              ))}
            </div>
          </fieldset>
          <Button type="submit" variant="portal" disabled={busy === "create"}>
            {busy === "create" ? "Salvando..." : "Adicionar webhook"}
          </Button>
        </form>
      </Card>

      <Card>
        <SectionHeader title="Endpoints configurados" />
        {webhooks.length === 0 ? (
          <EmptyState message="Nenhum webhook cadastrado." />
        ) : (
          <ul className="mt-4 divide-y divide-[var(--border-default)]">
            {webhooks.map((wh) => (
              <li key={wh.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {wh.label}{" "}
                    <span className="text-xs font-normal text-[var(--text-muted)]">
                      {wh.active ? "· ativo" : "· pausado"}
                      {wh.hasSecret ? " · HMAC" : ""}
                    </span>
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">{wh.url}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {wh.events.map((e) => EVENT_LABELS[e]).join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy === wh.id}
                    onClick={() => toggleActive(wh.id, !wh.active)}
                  >
                    {wh.active ? "Pausar" : "Ativar"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy === `del-${wh.id}`}
                    onClick={() => removeWebhook(wh.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
