import "server-only";
import type { AssistantToolDefinition } from "@/lib/assistant/types";
import { createPendingAction } from "@/lib/assistant/pending-actions";
import { ROLES } from "@/lib/roles";
import { isAssignableRole } from "@/lib/user-service";
import { isInternoProfile } from "@/lib/interno-permissions";
import { parseAssistantDate, toIsoDate } from "@/lib/assistant/dates";
import { getPrisma } from "@/lib/db";
import {
  resolveAppointmentDraft,
  type AppointmentDraftArgs,
} from "@/lib/assistant/appointment-draft";

function draftResult(input: {
  userId: string;
  tenantId: string;
  payload: Parameters<typeof createPendingAction>[2];
  preview: string;
  summary: Record<string, string>;
  href?: string;
}) {
  const pendingActionId = createPendingAction(input.userId, input.tenantId, input.payload);
  return {
    __assistant_pending: true as const,
    pendingActionId,
    preview: input.preview,
    summary: input.summary,
    href: input.href,
  };
}

export const internoWriteTools: AssistantToolDefinition[] = [
  {
    name: "draft_create_user",
    description: "Prepara criação de usuário (requer confirmação). Informe nome, e-mail, senha e perfil (PRESTADOR, INTERNO, PJ, BENEFICIARIO).",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nome completo" },
        email: { type: "string", description: "E-mail de login" },
        password: { type: "string", description: "Senha inicial" },
        role: { type: "string", description: "PRESTADOR | INTERNO | PJ | BENEFICIARIO" },
        internoProfile: { type: "string", description: "ADMIN | FATURAMENTO | RECEPCAO | READONLY (se INTERNO)" },
      },
      required: ["name", "email", "password", "role"],
    },
    requiredModule: "cadastros",
    kind: "draft",
    handler: async (ctx, args) => {
      const data = args as {
        name?: string;
        email?: string;
        password?: string;
        role?: string;
        internoProfile?: string;
      };

      if (!data.name?.trim() || !data.email?.trim() || !data.password?.trim() || !data.role) {
        const missing = getMissingFieldsForTool("draft_create_user", data);
        return buildIncompleteDraftResult("draft_create_user", data, ctx.labels, missing);
      }

      const role = data.role.toUpperCase();
      if (!isAssignableRole(role)) return { error: "Perfil inválido." };
      if (role === ROLES.INTERNO && data.internoProfile && !isInternoProfile(data.internoProfile)) {
        return { error: "Perfil interno inválido." };
      }

      return draftResult({
        userId: ctx.user.id,
        tenantId: ctx.user.tenantId,
        payload: {
          type: "create_user",
          data: {
            name: data.name.trim(),
            email: data.email.trim(),
            password: data.password,
            role,
            internoProfile: data.internoProfile ?? null,
          },
        },
        preview: `Criar usuário ${data.name.trim()} (${data.email.trim()}) como ${role}`,
        summary: {
          Nome: data.name.trim(),
          "E-mail": data.email.trim(),
          Perfil: role,
          ...(data.internoProfile ? { "Perfil interno": data.internoProfile } : {}),
        },
        href: "/interno/cadastros",
      });
    },
  },
  {
    name: "draft_create_patient",
    description: `Prepara cadastro de paciente/beneficiário (requer confirmação). Informe nome, CPF e data de nascimento.`,
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        cpf: { type: "string" },
        birthDate: { type: "string", description: "YYYY-MM-DD ou DD/MM/AAAA" },
        phone: { type: "string" },
        email: { type: "string" },
      },
      required: ["name", "cpf", "birthDate"],
    },
    requiredModule: "cadastros",
    kind: "draft",
    handler: async (ctx, args) => {
      const data = args as {
        name?: string;
        cpf?: string;
        birthDate?: string;
        phone?: string;
        email?: string;
      };

      if (!data.name?.trim() || !data.cpf?.trim() || !data.birthDate) {
        const missing = getMissingFieldsForTool("draft_create_patient", data);
        return buildIncompleteDraftResult("draft_create_patient", data, ctx.labels, missing);
      }

      const birth = parseAssistantDate(data.birthDate);
      const birthIso = toIsoDate(birth);

      return draftResult({
        userId: ctx.user.id,
        tenantId: ctx.user.tenantId,
        payload: {
          type: "create_patient",
          data: {
            name: data.name.trim(),
            cpf: data.cpf.trim(),
            birthDate: birthIso,
            phone: data.phone ?? null,
            email: data.email ?? null,
          },
        },
        preview: `Cadastrar ${ctx.labels.patient.toLowerCase()} ${data.name.trim()}`,
        summary: {
          Nome: data.name.trim(),
          CPF: data.cpf.trim(),
          "Nascimento": birth.toLocaleDateString("pt-BR"),
        },
        href: "/interno/cadastros",
      });
    },
  },
  {
    name: "draft_create_appointment",
    description: "Prepara agendamento (requer confirmação). Informe paciente, prestador, data e hora.",
    parameters: {
      type: "object",
      properties: {
        patientId: { type: "string" },
        patientName: { type: "string" },
        providerId: { type: "string" },
        providerName: { type: "string" },
        procedureId: { type: "string" },
        procedureName: { type: "string" },
        date: { type: "string", description: "Data (hoje, DD/MM/AAAA, YYYY-MM-DD)" },
        time: { type: "string", description: "Hora HH:MM" },
        reason: { type: "string" },
      },
      required: ["date", "time"],
    },
    requiredModule: "agenda",
    kind: "draft",
    handler: async (ctx, args) => {
      const data = args as AppointmentDraftArgs;

      const resolved = await resolveAppointmentDraft({
        tenantId: ctx.user.tenantId,
        labels: ctx.labels,
        data,
        tool: "draft_create_appointment",
      });
      if (!("ok" in resolved) || !resolved.ok) {
        return resolved.result;
      }

      const finalData = resolved.data;
      const procedureLabel = resolved.procedureLabel;

      const baseDate = parseAssistantDate(finalData.date!);
      const [hour, minute] = finalData.time!.split(":").map(Number);
      if (Number.isNaN(hour) || Number.isNaN(minute)) {
        return { error: "Hora inválida. Use HH:MM." };
      }
      baseDate.setHours(hour, minute, 0, 0);

      const prisma = await getPrisma();
      const [patient, provider] = await Promise.all([
        prisma.patient.findFirst({
          where: { id: finalData.patientId!, tenantId: ctx.user.tenantId },
        }),
        prisma.user.findFirst({
          where: { id: finalData.providerId!, tenantId: ctx.user.tenantId },
        }),
      ]);

      const reason =
        finalData.reason?.trim() ||
        (procedureLabel ? `${ctx.labels.procedure}: ${procedureLabel}` : null);

      return draftResult({
        userId: ctx.user.id,
        tenantId: ctx.user.tenantId,
        payload: {
          type: "create_appointment",
          data: {
            patientId: finalData.patientId!,
            providerId: finalData.providerId!,
            procedureId: finalData.procedureId,
            scheduledAt: baseDate.toISOString(),
            reason,
          },
        },
        preview: `Agendar ${ctx.labels.appointment.toLowerCase()} para ${patient?.name ?? "paciente"}`,
        summary: {
          [ctx.labels.patient]: patient?.name ?? finalData.patientName ?? "—",
          [ctx.labels.provider]: provider?.name ?? finalData.providerName ?? "—",
          Data: baseDate.toLocaleString("pt-BR"),
          ...(procedureLabel ? { [ctx.labels.procedure]: procedureLabel } : {}),
          ...(reason && !procedureLabel ? { Motivo: reason } : {}),
        },
        href: "/interno/agenda",
      });
    },
  },
];
