import "server-only";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";

export const WEBHOOK_EVENTS = [
  "INVOICE_ISSUED",
  "APPOINTMENT_CREATED",
  "COMPANY_STATUS_CHANGED",
  "PATIENT_CREATED",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

const EVENT_SET = new Set<string>(WEBHOOK_EVENTS);

export function isWebhookEvent(value: string): value is WebhookEvent {
  return EVENT_SET.has(value);
}

export function parseWebhookEvents(json: string): WebhookEvent[] {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e): e is WebhookEvent => typeof e === "string" && isWebhookEvent(e));
  } catch {
    return [];
  }
}

export type WebhookPayload = {
  event: WebhookEvent;
  tenantId: string;
  timestamp: string;
  data: Record<string, unknown>;
};

/** Dispara webhooks ativos do tenant para o evento (fire-and-forget). */
export async function dispatchWebhooks(input: {
  tenantId: string;
  event: WebhookEvent;
  data: Record<string, unknown>;
}): Promise<void> {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { tenantId: input.tenantId, active: true },
  });

  const payload: WebhookPayload = {
    event: input.event,
    tenantId: input.tenantId,
    timestamp: new Date().toISOString(),
    data: input.data,
  };

  const body = JSON.stringify(payload);

  await Promise.all(
    endpoints.map(async (endpoint) => {
      const events = parseWebhookEvents(endpoint.events);
      if (!events.includes(input.event)) return;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Bibi-Event": input.event,
      };

      if (endpoint.secret) {
        const signature = crypto
          .createHmac("sha256", endpoint.secret)
          .update(body)
          .digest("hex");
        headers["X-Bibi-Signature"] = signature;
      }

      try {
        const res = await fetch(endpoint.url, {
          method: "POST",
          headers,
          body,
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) {
          console.warn(`[webhook] ${endpoint.url} → HTTP ${res.status}`);
        }
      } catch (error) {
        console.warn(`[webhook] falha ${endpoint.url}:`, error);
      }
    }),
  );
}

export type WebhookView = {
  id: string;
  label: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;
  hasSecret: boolean;
  createdAt: string;
};

export async function listWebhooks(tenantId: string): Promise<WebhookView[]> {
  const rows = await prisma.webhookEndpoint.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    url: row.url,
    events: parseWebhookEvents(row.events),
    active: row.active,
    hasSecret: Boolean(row.secret),
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function createWebhook(input: {
  tenantId: string;
  label: string;
  url: string;
  secret?: string | null;
  events: WebhookEvent[];
}) {
  if (input.events.length === 0) {
    return { error: "Selecione ao menos um evento" as const };
  }

  try {
    new URL(input.url);
  } catch {
    return { error: "URL inválida" as const };
  }

  const webhook = await prisma.webhookEndpoint.create({
    data: {
      tenantId: input.tenantId,
      label: input.label.trim(),
      url: input.url.trim(),
      secret: input.secret?.trim() || null,
      events: JSON.stringify(input.events),
    },
  });

  return {
    webhook: {
      id: webhook.id,
      label: webhook.label,
      url: webhook.url,
      events: input.events,
      active: webhook.active,
      hasSecret: Boolean(webhook.secret),
      createdAt: webhook.createdAt.toISOString(),
    },
  };
}

export async function deleteWebhook(tenantId: string, webhookId: string) {
  const existing = await prisma.webhookEndpoint.findFirst({
    where: { id: webhookId, tenantId },
  });
  if (!existing) return null;
  await prisma.webhookEndpoint.delete({ where: { id: existing.id } });
  return { ok: true as const };
}

export async function toggleWebhook(tenantId: string, webhookId: string, active: boolean) {
  const existing = await prisma.webhookEndpoint.findFirst({
    where: { id: webhookId, tenantId },
  });
  if (!existing) return null;
  const updated = await prisma.webhookEndpoint.update({
    where: { id: existing.id },
    data: { active },
  });
  return { active: updated.active };
}
