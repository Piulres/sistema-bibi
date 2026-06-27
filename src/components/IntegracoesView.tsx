"use client";

import { useCallback, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { fetchJson } from "@/lib/ui/api-feedback";
import { confirmPresets } from "@/lib/ui/confirm-presets";

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

type DeliveryRow = {
  id: string;
  webhookLabel: string;
  event: string;
  status: string;
  httpStatus: number | null;
  errorMessage: string | null;
  attempt: number;
  maxAttempts: number;
  createdAt: string;
};

type IntegracoesData = {
  webhooks: WebhookRow[];
  events: WebhookEvent[];
  deliveries: DeliveryRow[];
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
  const { isBusy, run, showToast } = useAsyncAction();
  const [form, setForm] = useState({
    label: "",
    url: "",
    secret: "",
    events: [] as WebhookEvent[],
  });

  const loadIntegracoes = useCallback(async () => {
    const [hooksRes, deliveriesRes] = await Promise.all([
      fetchJson<{ webhooks?: WebhookRow[]; events?: WebhookEvent[] }>(
        "/api/interno/webhooks",
        undefined,
        "Erro ao carregar webhooks",
      ),
      fetchJson<{ deliveries?: DeliveryRow[] }>("/api/interno/webhooks/deliveries"),
    ]);
    if (!hooksRes.ok) return hooksRes;
    return {
      ok: true as const,
      data: {
        webhooks: hooksRes.data.webhooks ?? [],
        events: hooksRes.data.events ?? [],
        deliveries: deliveriesRes.ok ? (deliveriesRes.data.deliveries ?? []) : [],
      } satisfies IntegracoesData,
      status: hooksRes.status,
    };
  }, []);

  const { data, loading, error, reload } = useAsyncData(loadIntegracoes, [], {
    forbiddenMessage: "Sem permissão para acessar integrações",
  });

  const webhooks = data?.webhooks ?? [];
  const deliveries = data?.deliveries ?? [];
  const events = data?.events ?? [];

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
    await run(
      "create",
      () =>
        fetch("/api/interno/webhooks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            secret: form.secret || null,
          }),
        }),
      {
        silentSuccess: true,
        errorMessage: "Erro ao criar webhook",
        onSuccess: async (body) => {
          const webhook = body.webhook as { label?: string } | undefined;
          showToast({
            message: `Webhook "${webhook?.label ?? form.label}" criado`,
            tone: "success",
          });
          setForm({ label: "", url: "", secret: "", events: [] });
          await reload();
        },
      },
    );
  }

  async function toggleActive(id: string, active: boolean) {
    await run(
      id,
      () =>
        fetch(`/api/interno/webhooks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active }),
        }),
      {
        silentSuccess: true,
        onSuccess: () => { void reload(); },
      },
    );
  }

  async function removeWebhook(id: string, label: string) {
    await run(
      `del-${id}`,
      () => fetch(`/api/interno/webhooks/${id}`, { method: "DELETE" }),
      {
        confirm: confirmPresets.deleteWebhook(label),
        successMessage: "Webhook removido",
        onSuccess: () => { void reload(); },
      },
    );
  }

  async function retryDelivery(id: string) {
    await run(
      `retry-${id}`,
      () => fetch(`/api/interno/webhooks/deliveries/${id}/retry`, { method: "POST" }),
      {
        successMessage: "Retry executado",
        onSuccess: () => { void reload(); },
      },
    );
  }

  return (
    <ViewStateBoundary
      loading={loading}
      error={error}
      loadingMessage="Carregando integrações..."
      onRetry={() => void reload()}
    >
      <div className="space-y-8">
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
            <Button type="submit" variant="portal" disabled={isBusy("create")}>
              {isBusy("create") ? "Salvando..." : "Adicionar webhook"}
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
                      disabled={isBusy(wh.id)}
                      onClick={() => toggleActive(wh.id, !wh.active)}
                    >
                      {wh.active ? "Pausar" : "Ativar"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isBusy(`del-${wh.id}`)}
                      onClick={() => removeWebhook(wh.id, wh.label)}
                    >
                      Excluir
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionHeader
            title="Log de entregas"
            description="Histórico com retry automático (backoff exponencial) e reenvio manual."
          />
          {deliveries.length === 0 ? (
            <EmptyState message="Nenhuma entrega registrada ainda." />
          ) : (
            <ul className="mt-4 divide-y divide-[var(--border-default)]">
              {deliveries.map((d) => (
                <li key={d.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {EVENT_LABELS[d.event as WebhookEvent] ?? d.event} · {d.webhookLabel}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(d.createdAt).toLocaleString("pt-BR")} · {d.status}
                      {d.httpStatus ? ` · HTTP ${d.httpStatus}` : ""}
                      {d.errorMessage ? ` · ${d.errorMessage}` : ""}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Tentativa {d.attempt}/{d.maxAttempts}
                    </p>
                  </div>
                  {d.status !== "SUCCESS" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isBusy(`retry-${d.id}`)}
                      onClick={() => retryDelivery(d.id)}
                    >
                      Reenviar
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </ViewStateBoundary>
  );
}
