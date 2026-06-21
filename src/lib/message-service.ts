import "server-only";
import { prisma } from "@/lib/db";
import {
  CommunicationProviderNotConfiguredError,
  sendEmail,
  sendSms,
  sendWhatsApp,
} from "@/lib/communications";
import {
  buildTemplateBody,
  channelLabel,
  messageStatusLabel,
  templateLabel,
} from "@/lib/message";
import {
  recordTimelineEvent,
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "@/lib/timeline";

const dateTime = (value: Date) =>
  value.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export type MessageView = {
  id: string;
  channel: string;
  channelLabel: string;
  template: string;
  templateLabel: string;
  subject: string | null;
  body: string;
  status: string;
  statusLabel: string;
  externalId: string | null;
  sentAt: string | null;
  sentAtLabel: string | null;
  createdAt: string;
  createdAtLabel: string;
  patientId: string;
  patientName: string;
  patientPhone: string | null;
};

function mapMessage(msg: {
  id: string;
  channel: string;
  template: string;
  subject: string | null;
  body: string;
  status: string;
  externalId: string | null;
  sentAt: Date | null;
  createdAt: Date;
  patientId: string;
  patient: { name: string; phone: string | null };
}): MessageView {
  return {
    id: msg.id,
    channel: msg.channel,
    channelLabel: channelLabel(msg.channel),
    template: msg.template,
    templateLabel: templateLabel(msg.template),
    subject: msg.subject,
    body: msg.body,
    status: msg.status,
    statusLabel: messageStatusLabel(msg.status),
    externalId: msg.externalId,
    sentAt: msg.sentAt?.toISOString() ?? null,
    sentAtLabel: msg.sentAt ? dateTime(msg.sentAt) : null,
    createdAt: msg.createdAt.toISOString(),
    createdAtLabel: dateTime(msg.createdAt),
    patientId: msg.patientId,
    patientName: msg.patient.name,
    patientPhone: msg.patient.phone,
  };
}

export async function listMessages(tenantId: string): Promise<MessageView[]> {
  const rows = await prisma.message.findMany({
    where: { tenantId },
    include: { patient: { select: { name: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapMessage);
}

export async function listPatientsForMessaging(tenantId: string) {
  return prisma.patient.findMany({
    where: { tenantId },
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" },
  });
}

export async function queueMessage(input: {
  tenantId: string;
  patientId: string;
  channel: string;
  template: string;
  subject?: string | null;
  body: string;
  createdBy: string;
}) {
  const patient = await prisma.patient.findFirst({
    where: { id: input.patientId, tenantId: input.tenantId },
  });
  if (!patient) return null;

  const message = await prisma.message.create({
    data: {
      tenantId: input.tenantId,
      patientId: input.patientId,
      channel: input.channel,
      template: input.template,
      subject: input.subject ?? null,
      body: input.body,
      status: "PENDENTE",
      createdBy: input.createdBy,
    },
    include: { patient: { select: { name: true, phone: true } } },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.MESSAGE,
    entityId: message.id,
    action: TIMELINE_ACTIONS.MESSAGE_QUEUED,
    description: `${channelLabel(message.channel)} enfileirado para ${patient.name} (${templateLabel(message.template)})`,
    createdBy: input.createdBy,
  });

  return mapMessage(message);
}

export async function dispatchMessage(input: {
  tenantId: string;
  messageId: string;
  createdBy: string;
}) {
  const message = await prisma.message.findFirst({
    where: { id: input.messageId, tenantId: input.tenantId },
    include: { patient: true },
  });

  if (!message) return null;
  if (message.status !== "PENDENTE") {
    return { error: "Somente mensagens PENDENTE podem ser despachadas" as const };
  }

  const request = {
    reference: {
      tenantId: message.tenantId,
      patientId: message.patientId,
      messageId: message.id,
      companyId: message.patient.companyId,
    },
    channel: message.channel as "EMAIL" | "SMS" | "WHATSAPP",
    template: message.template as "GENERIC",
    subject: message.subject,
    body: message.body,
    recipient: {
      name: message.patient.name,
      phone: message.patient.phone ?? undefined,
      cpf: message.patient.cpf,
    },
  };

  try {
    const result =
      message.channel === "EMAIL"
        ? await sendEmail(request)
        : message.channel === "SMS"
          ? await sendSms(request)
          : await sendWhatsApp(request);

    const updated = await prisma.message.update({
      where: { id: message.id },
      data: {
        status: "ENVIADA",
        externalId: result.externalId,
        sentAt: result.sentAt,
      },
      include: { patient: { select: { name: true, phone: true } } },
    });

    await recordTimelineEvent({
      tenantId: input.tenantId,
      entityType: TIMELINE_ENTITY_TYPES.MESSAGE,
      entityId: message.id,
      action: TIMELINE_ACTIONS.MESSAGE_SENT,
      description: `${channelLabel(message.channel)} enviado para ${message.patient.name}`,
      createdBy: input.createdBy,
    });

    return { message: mapMessage(updated) };
  } catch (error) {
    if (error instanceof CommunicationProviderNotConfiguredError) {
      return { error: error.message };
    }

    await prisma.message.update({
      where: { id: message.id },
      data: { status: "FALHA" },
    });

    await recordTimelineEvent({
      tenantId: input.tenantId,
      entityType: TIMELINE_ENTITY_TYPES.MESSAGE,
      entityId: message.id,
      action: TIMELINE_ACTIONS.MESSAGE_FAILED,
      description: `Falha ao enviar ${channelLabel(message.channel)} para ${message.patient.name}`,
      createdBy: input.createdBy,
    });

    throw error;
  }
}

export async function cancelMessage(input: {
  tenantId: string;
  messageId: string;
  createdBy: string;
}) {
  const message = await prisma.message.findFirst({
    where: { id: input.messageId, tenantId: input.tenantId },
    include: { patient: { select: { name: true, phone: true } } },
  });

  if (!message) return null;
  if (message.status !== "PENDENTE") {
    return { error: "Somente mensagens PENDENTE podem ser canceladas" as const };
  }

  const updated = await prisma.message.update({
    where: { id: message.id },
    data: { status: "CANCELADA" },
    include: { patient: { select: { name: true, phone: true } } },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.MESSAGE,
    entityId: message.id,
    action: TIMELINE_ACTIONS.UPDATED,
    description: `Comunicacao cancelada para ${message.patient.name}`,
    createdBy: input.createdBy,
  });

  return { message: mapMessage(updated) };
}

export { buildTemplateBody };
