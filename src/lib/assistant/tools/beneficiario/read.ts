import "server-only";
import type { AssistantToolDefinition } from "@/lib/assistant/types";
import { getBeneficiaryOverview } from "@/lib/beneficiary-overview";
import { getAvailableSlots } from "@/lib/scheduling-service";
import { listProviders } from "@/lib/appointment-service";
import { createPendingAction } from "@/lib/assistant/pending-actions";
import { parseAssistantDate } from "@/lib/assistant/dates";

export const beneficiarioReadTools: AssistantToolDefinition[] = [
  {
    name: "get_my_overview",
    description: "Resumo da conta: próximo agendamento, faturas, assinaturas.",
    parameters: { type: "object", properties: {} },
    requiredRoles: ["BENEFICIARIO"],
    handler: async (ctx) => {
      if (!ctx.user.patientId) return { error: "Conta sem beneficiário vinculado." };
      const overview = await getBeneficiaryOverview(ctx.user.patientId, ctx.user.tenantId);
      if (!overview) return { error: "Beneficiário não encontrado." };
      return {
        patientName: overview.patient.name,
        nextAppointment: overview.nextAppointment,
        openInvoices: overview.invoices.filter((i) => i.status !== "PAGA").length,
        subscriptions: overview.subscriptions.length,
        pendingUsages: overview.pendingUsages.length,
      };
    },
  },
  {
    name: "list_my_appointments",
    description: "Lista meus agendamentos futuros e recentes.",
    parameters: { type: "object", properties: {} },
    requiredRoles: ["BENEFICIARIO"],
    handler: async (ctx) => {
      if (!ctx.user.patientId) return { error: "Conta sem beneficiário vinculado." };
      const overview = await getBeneficiaryOverview(ctx.user.patientId, ctx.user.tenantId);
      if (!overview) return { error: "Beneficiário não encontrado." };
      return {
        count: overview.appointments.length,
        appointments: overview.appointments.slice(0, 10),
      };
    },
  },
  {
    name: "list_my_invoices",
    description: "Lista minhas faturas.",
    parameters: { type: "object", properties: {} },
    requiredRoles: ["BENEFICIARIO"],
    handler: async (ctx) => {
      if (!ctx.user.patientId) return { error: "Conta sem beneficiário vinculado." };
      const overview = await getBeneficiaryOverview(ctx.user.patientId, ctx.user.tenantId);
      if (!overview) return { error: "Beneficiário não encontrado." };
      return {
        count: overview.invoices.length,
        invoices: overview.invoices.slice(0, 10).map((inv) => ({
          id: inv.id,
          totalLabel: inv.totalLabel,
          status: inv.status,
          createdAtLabel: inv.createdAtLabel,
        })),
      };
    },
  },
  {
    name: "list_available_slots",
    description: "Horários disponíveis para agendar com um prestador em uma data.",
    parameters: {
      type: "object",
      properties: {
        providerId: { type: "string" },
        providerName: { type: "string" },
        date: { type: "string" },
      },
      required: ["date"],
    },
    requiredRoles: ["BENEFICIARIO"],
    handler: async (ctx, args) => {
      const data = args as { providerId?: string; providerName?: string; date?: string };
      const providers = await listProviders(ctx.user.tenantId);
      let providerId = data.providerId;
      if (!providerId && data.providerName) {
        providerId = providers.find((p) =>
          p.name.toLowerCase().includes(data.providerName!.toLowerCase()),
        )?.id;
      }
      providerId ??= providers[0]?.id;
      if (!providerId) return { error: "Nenhum prestador disponível." };

      const date = parseAssistantDate(data.date ?? "hoje");
      const { slots } = await getAvailableSlots({
        tenantId: ctx.user.tenantId,
        providerId,
        date,
      });
      return { providerId, date: date.toLocaleDateString("pt-BR"), slots: slots.slice(0, 8) };
    },
  },
  {
    name: "draft_book_appointment",
    description: "Prepara agendamento self-service (requer confirmação).",
    parameters: {
      type: "object",
      properties: {
        providerId: { type: "string" },
        scheduledAt: { type: "string", description: "ISO datetime do slot" },
        reason: { type: "string" },
      },
      required: ["scheduledAt"],
    },
    requiredRoles: ["BENEFICIARIO"],
    kind: "draft",
    handler: async (ctx, args) => {
      if (!ctx.user.patientId) return { error: "Conta sem beneficiário vinculado." };
      const data = args as { providerId?: string; scheduledAt?: string; reason?: string };
      if (!data.scheduledAt) return { error: "Informe o horário (scheduledAt)." };

      const providers = await listProviders(ctx.user.tenantId);
      const providerId = data.providerId ?? providers[0]?.id;
      if (!providerId) return { error: "Prestador não encontrado." };

      const provider = providers.find((p) => p.id === providerId);
      const scheduled = new Date(data.scheduledAt);
      const pendingActionId = createPendingAction(ctx.user.id, ctx.user.tenantId, {
        type: "book_appointment",
        data: {
          patientId: ctx.user.patientId,
          providerId,
          scheduledAt: scheduled.toISOString(),
          reason: data.reason ?? null,
        },
      });

      return {
        __assistant_pending: true as const,
        pendingActionId,
        preview: `Agendar ${ctx.labels.appointment.toLowerCase()} com ${provider?.name ?? "prestador"}`,
        summary: {
          [ctx.labels.provider]: provider?.name ?? providerId,
          Horário: scheduled.toLocaleString("pt-BR"),
          ...(data.reason ? { Motivo: data.reason } : {}),
        },
        href: "/beneficiario/agendar",
      };
    },
  },
];
