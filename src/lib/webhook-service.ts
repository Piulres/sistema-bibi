import "server-only";
import crypto from "node:crypto";
import { getPrisma } from "@/lib/db";

export const WEBHOOK_EVENTS = [
  "INVOICE_ISSUED",
  "APPOINTMENT_CREATED",
  "COMPANY_STATUS_CHANGED",
  "PATIENT_CREATED",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

const EVENT_SET = new Set<string>(WEBHOOK_EVENTS);
const MAX_ATTEMPTS = 5;

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

function retryDelayMs(attempt: number): number {
  return Math.min(60_000 * 2 ** (attempt - 1), 15 * 60_000);
}

async function deliverToEndpoint(input: {
  endpoint: { id: string; url: string; secret: string | null; tenantId: string };
  event: WebhookEvent;
  payload: WebhookPayload;
  deliveryId?: string;
  attempt?: number;
}): Promise<{ ok: boolean; httpStatus?: number; errorMessage?: string }> {
  const body = JSON.stringify(input.payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Bibi-Event": input.event,
  };

  if (input.endpoint.secret) {
    headers["X-Bibi-Signature"] = crypto
      .createHmac("sha256", input.endpoint.secret)
      .update(body)
      .digest("hex");
  }

  try {
    const res = await fetch(input.endpoint.url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return { ok: false, httpStatus: res.status, errorMessage: `HTTP ${res.status}` };
    }
    return { ok: true, httpStatus: res.status };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha de rede";
    return { ok: false, errorMessage: message };
  }
}

async function recordDeliveryResult(input: {
  deliveryId: string;
  ok: boolean;
  httpStatus?: number;
  errorMessage?: string;
  attempt: number;
}) {
  const prisma = await getPrisma();
  if (input.ok) {
    await prisma.webhookDelivery.update({
      where: { id: input.deliveryId },
      data: {
        status: "SUCCESS",
        httpStatus: input.httpStatus ?? null,
        errorMessage: null,
        deliveredAt: new Date(),
        nextRetryAt: null,
      },
    });
    return;
  }

  const shouldRetry = input.attempt < MAX_ATTEMPTS;
  await prisma.webhookDelivery.update({
    where: { id: input.deliveryId },
    data: {
      status: shouldRetry ? "PENDING" : "FAILED",
      httpStatus: input.httpStatus ?? null,
      errorMessage: input.errorMessage ?? "Erro desconhecido",
      attempt: input.attempt,
      nextRetryAt: shouldRetry ? new Date(Date.now() + retryDelayMs(input.attempt)) : null,
    },
  });
}

/** Dispara webhooks ativos do tenant para o evento com log e retry. */
export async function dispatchWebhooks(input: {
  tenantId: string;
  event: WebhookEvent;
  data: Record<string, unknown>;
}): Promise<void> {
  const prisma = await getPrisma();
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { tenantId: input.tenantId, active: true },
  });

  const payload: WebhookPayload = {
    event: input.event,
    tenantId: input.tenantId,
    timestamp: new Date().toISOString(),
    data: input.data,
  };

  await Promise.all(
    endpoints.map(async (endpoint) => {
      const events = parseWebhookEvents(endpoint.events);
      if (!events.includes(input.event)) return;

      const delivery = await prisma.webhookDelivery.create({
        data: {
          tenantId: input.tenantId,
          webhookId: endpoint.id,
          event: input.event,
          payload: JSON.stringify(payload),
          status: "PENDING",
          attempt: 1,
          maxAttempts: MAX_ATTEMPTS,
        },
      });

      const result = await deliverToEndpoint({
        endpoint,
        event: input.event,
        payload,
        deliveryId: delivery.id,
        attempt: 1,
      });

      await recordDeliveryResult({
        deliveryId: delivery.id,
        ok: result.ok,
        httpStatus: result.httpStatus,
        errorMessage: result.errorMessage,
        attempt: 1,
      });
    }),
  );
}

export type WebhookDeliveryView = {
  id: string;
  webhookLabel: string;
  event: string;
  status: string;
  httpStatus: number | null;
  errorMessage: string | null;
  attempt: number;
  maxAttempts: number;
  nextRetryAt: string | null;
  createdAt: string;
  deliveredAt: string | null;
};

export async function listWebhookDeliveries(
  tenantId: string,
  limit = 50,
): Promise<WebhookDeliveryView[]> {
  const prisma = await getPrisma();
  const rows = await prisma.webhookDelivery.findMany({
    where: { tenantId },
    include: { webhook: { select: { label: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    webhookLabel: row.webhook.label,
    event: row.event,
    status: row.status,
    httpStatus: row.httpStatus,
    errorMessage: row.errorMessage,
    attempt: row.attempt,
    maxAttempts: row.maxAttempts,
    nextRetryAt: row.nextRetryAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    deliveredAt: row.deliveredAt?.toISOString() ?? null,
  }));
}

export async function retryWebhookDelivery(tenantId: string, deliveryId: string) {
  const prisma = await getPrisma();
  const delivery = await prisma.webhookDelivery.findFirst({
    where: { id: deliveryId, tenantId },
    include: { webhook: true },
  });
  if (!delivery) return null;
  if (delivery.status === "SUCCESS") {
    return { error: "Entrega já concluída com sucesso" as const };
  }

  const payload = JSON.parse(delivery.payload) as WebhookPayload;
  const nextAttempt = delivery.attempt + 1;
  if (nextAttempt > delivery.maxAttempts) {
    return { error: "Número máximo de tentativas atingido" as const };
  }

  const result = await deliverToEndpoint({
    endpoint: delivery.webhook,
    event: delivery.event as WebhookEvent,
    payload,
    attempt: nextAttempt,
  });

  await prisma.webhookDelivery.update({
    where: { id: delivery.id },
    data: { attempt: nextAttempt },
  });

  await recordDeliveryResult({
    deliveryId: delivery.id,
    ok: result.ok,
    httpStatus: result.httpStatus,
    errorMessage: result.errorMessage,
    attempt: nextAttempt,
  });

  return { ok: true as const };
}

/** Processa fila de retries (cron). */
export async function processWebhookRetries(): Promise<{ processed: number; succeeded: number }> {
  const prisma = await getPrisma();
  const now = new Date();
  const pending = await prisma.webhookDelivery.findMany({
    where: {
      status: "PENDING",
      nextRetryAt: { lte: now },
      attempt: { lt: MAX_ATTEMPTS },
    },
    include: { webhook: true },
    take: 20,
  });

  let succeeded = 0;
  for (const delivery of pending) {
    const payload = JSON.parse(delivery.payload) as WebhookPayload;
    const nextAttempt = delivery.attempt + 1;
    const result = await deliverToEndpoint({
      endpoint: delivery.webhook,
      event: delivery.event as WebhookEvent,
      payload,
      attempt: nextAttempt,
    });

    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: { attempt: nextAttempt },
    });

    await recordDeliveryResult({
      deliveryId: delivery.id,
      ok: result.ok,
      httpStatus: result.httpStatus,
      errorMessage: result.errorMessage,
      attempt: nextAttempt,
    });

    if (result.ok) succeeded++;
  }

  return { processed: pending.length, succeeded };
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
  const prisma = await getPrisma();
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
  const prisma = await getPrisma();
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
  const prisma = await getPrisma();
  const existing = await prisma.webhookEndpoint.findFirst({
    where: { id: webhookId, tenantId },
  });
  if (!existing) return null;
  await prisma.webhookEndpoint.delete({ where: { id: existing.id } });
  return { ok: true as const };
}

export async function toggleWebhook(tenantId: string, webhookId: string, active: boolean) {
  const prisma = await getPrisma();
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
