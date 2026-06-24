import "server-only";
import type { AssistantToolDefinition } from "@/lib/assistant/types";
import { createPendingAction } from "@/lib/assistant/pending-actions";
import { listPatients } from "@/lib/patient-service";
import { listProviders } from "@/lib/appointment-service";
import { ROLES } from "@/lib/roles";
import { isAssignableRole } from "@/lib/user-service";
import { isInternoProfile } from "@/lib/interno-permissions";
import { parseAssistantDate, toIsoDate } from "@/lib/assistant/dates";
import { getPrisma } from "@/lib/db";

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

async function resolvePatientId(tenantId: string, patientId?: string, patientName?: string) {
  if (patientId) return patientId;
  if (!patientName) return null;
  const patients = await listPatients(tenantId);
  const match = patients.find((p) => p.name.toLowerCase().includes(patientName.toLowerCase()));
  return match?.id ?? null;
}

async function resolveProviderId(tenantId: string, providerId?: string, providerName?: string) {
  if (providerId) return providerId;
  const providers = await listProviders(tenantId);
  const norm = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/\./g, "")
      .replace(/\s+/g, " ")
      .trim();
  if (providerName) {
    const query = norm(providerName);
    const match = providers.find((p) => norm(p.name).includes(query) || query.includes(norm(p.name)));
    return match?.id ?? null;
  }
  return providers[0]?.id ?? null;
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
        return { error: "Informe nome, e-mail, senha e perfil." };
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
        return { error: "Informe nome, CPF e data de nascimento." };
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
        date: { type: "string", description: "Data (hoje, DD/MM/AAAA, YYYY-MM-DD)" },
        time: { type: "string", description: "Hora HH:MM" },
        reason: { type: "string" },
      },
      required: ["date", "time"],
    },
    requiredModule: "agenda",
    kind: "draft",
    handler: async (ctx, args) => {
      const data = args as {
        patientId?: string;
        patientName?: string;
        providerId?: string;
        providerName?: string;
        date?: string;
        time?: string;
        reason?: string;
      };

      const patientId = await resolvePatientId(ctx.user.tenantId, data.patientId, data.patientName);
      const providerId = await resolveProviderId(ctx.user.tenantId, data.providerId, data.providerName);

      if (!patientId) return { error: `${ctx.labels.patient} não encontrado.` };
      if (!providerId) return { error: `${ctx.labels.provider} não encontrado.` };
      if (!data.date || !data.time) return { error: "Informe data e hora." };

      const baseDate = parseAssistantDate(data.date);
      const [hour, minute] = data.time.split(":").map(Number);
      if (Number.isNaN(hour) || Number.isNaN(minute)) {
        return { error: "Hora inválida. Use HH:MM." };
      }
      baseDate.setHours(hour, minute, 0, 0);

      const prisma = await getPrisma();
      const [patient, provider] = await Promise.all([
        prisma.patient.findFirst({ where: { id: patientId, tenantId: ctx.user.tenantId } }),
        prisma.user.findFirst({ where: { id: providerId, tenantId: ctx.user.tenantId } }),
      ]);

      return draftResult({
        userId: ctx.user.id,
        tenantId: ctx.user.tenantId,
        payload: {
          type: "create_appointment",
          data: {
            patientId,
            providerId,
            scheduledAt: baseDate.toISOString(),
            reason: data.reason ?? null,
          },
        },
        preview: `Agendar ${ctx.labels.appointment.toLowerCase()} para ${patient?.name ?? "paciente"}`,
        summary: {
          [ctx.labels.patient]: patient?.name ?? patientId,
          [ctx.labels.provider]: provider?.name ?? providerId,
          Data: baseDate.toLocaleString("pt-BR"),
          ...(data.reason ? { Motivo: data.reason } : {}),
        },
        href: "/interno/agenda",
      });
    },
  },
];
