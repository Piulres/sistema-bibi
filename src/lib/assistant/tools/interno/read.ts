import "server-only";
import type { AssistantToolDefinition } from "@/lib/assistant/types";
import { getExecutiveDashboard } from "@/lib/executive-dashboard";
import { listAppointments } from "@/lib/appointment-service";
import { listPatients } from "@/lib/patient-service";
import { listUsers } from "@/lib/user-service";
import { getRevenueSummary } from "@/lib/assistant/queries/revenue";
import { listDebtors } from "@/lib/assistant/queries/debtors";
import { dayRange, formatDateLabel, parseAssistantDate } from "@/lib/assistant/dates";

import { formatChoiceQuestion, resolveFromOptions } from "@/lib/assistant/resolve-entities";

export const internoReadTools: AssistantToolDefinition[] = [
  {
    name: "get_dashboard_kpis",
    description: "Retorna KPIs consolidados do dashboard executivo (pacientes, empresas, agendamentos hoje, faturamento pendente, etc.).",
    parameters: { type: "object", properties: {} },
    requiredModule: "dashboard",
    handler: async (ctx) => {
      const dashboard = await getExecutiveDashboard(ctx.user.tenantId);
      return {
        generatedAtLabel: dashboard.generatedAtLabel,
        kpis: dashboard.kpis,
        revenue: dashboard.revenue,
        topPendingBilling: dashboard.topPendingBilling,
      };
    },
  },
  {
    name: "count_appointments",
    description: "Conta agendamentos em uma data. Aceita YYYY-MM-DD, DD/MM/AAAA ou palavras: hoje, ontem, amanhã.",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string", description: "Data alvo (ex: hoje, 2026-06-23, 23/06/2026)" },
      },
    },
    requiredModule: "agenda",
    handler: async (ctx, args) => {
      const date = parseAssistantDate((args as { date?: string }).date);
      const { from, to } = dayRange(date);
      const appointments = await listAppointments({
        tenantId: ctx.user.tenantId,
        from,
        to,
      });
      const active = appointments.filter((a) => a.status !== "CANCELADO");
      return {
        dateLabel: formatDateLabel(date),
        count: active.length,
        cancelled: appointments.length - active.length,
        sample: active.slice(0, 8).map((a) => ({
          time: a.scheduledAtLabel,
          patient: a.patientName,
          provider: a.providerName,
          status: a.status,
        })),
      };
    },
  },
  {
    name: "get_revenue_summary",
    description: "Resumo de receita/faturamento em um período. Parâmetros from/to aceitam datas relativas ou ISO.",
    parameters: {
      type: "object",
      properties: {
        from: { type: "string", description: "Data inicial" },
        to: { type: "string", description: "Data final (opcional; padrão = from)" },
      },
    },
    requiredModule: "relatorios",
    handler: async (ctx, args) => {
      const { from, to } = args as { from?: string; to?: string };
      return getRevenueSummary(ctx.user.tenantId, from, to);
    },
  },
  {
    name: "list_debtors",
    description: "Lista beneficiários/pacientes com pendências financeiras (faturas abertas ou procedimentos não faturados).",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Máximo de registros (padrão 10)" },
      },
    },
    requiredModule: "billing",
    handler: async (ctx, args) => {
      const limit = (args as { limit?: number }).limit ?? 10;
      const debtors = await listDebtors(ctx.user.tenantId, limit);
      return {
        count: debtors.length,
        debtors,
        totalLabel: debtors.reduce((sum, d) => sum + d.amount, 0).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
      };
    },
  },
  {
    name: "list_users",
    description: "Lista usuários do tenant (prestadores, internos, PJ, beneficiários).",
    parameters: {
      type: "object",
      properties: {
        search: { type: "string", description: "Filtro por nome ou e-mail" },
        role: { type: "string", description: "Filtrar por role: PRESTADOR, INTERNO, PJ, BENEFICIARIO" },
      },
    },
    requiredModule: "cadastros",
    handler: async (ctx, args) => {
      const { search, role } = args as { search?: string; role?: string };
      let users = await listUsers(ctx.user.tenantId);
      if (role) users = users.filter((u) => u.role === role.toUpperCase());
      if (search) {
        const q = search.toLowerCase();
        users = users.filter(
          (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
        );
      }
      return {
        count: users.length,
        users: users.slice(0, 15).map((u) => ({
          name: u.name,
          email: u.email,
          role: u.role,
          internoProfile: u.internoProfile,
        })),
      };
    },
  },
  {
    name: "search_patients",
    description: "Busca pacientes/beneficiários por nome ou CPF.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Nome ou CPF parcial" },
      },
      required: ["query"],
    },
    requiredModule: "cadastros",
    handler: async (ctx, args) => {
      const query = ((args as { query?: string }).query ?? "").trim().toLowerCase();
      const patients = await listPatients(ctx.user.tenantId);
      const matches = patients.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.cpf.replace(/\D/g, "").includes(query.replace(/\D/g, "")),
      );
      const options = matches.slice(0, 10).map((p) => ({
        id: p.id,
        label: p.name,
        detail: [p.cpf, p.companyName].filter(Boolean).join(" · ") || undefined,
      }));
      const resolved = resolveFromOptions(options, query);

      if (resolved.status === "ambiguous") {
        return {
          count: options.length,
          guidance: formatChoiceQuestion(ctx.labels.patient.toLowerCase(), options),
          patients: options.map((p) => ({
            id: p.id,
            name: p.label,
            cpf: p.detail?.split(" · ")[0] ?? "",
            companyName: p.detail?.includes(" · ") ? p.detail.split(" · ").slice(1).join(" · ") : null,
            phone: null,
          })),
        };
      }

      return {
        count: matches.length,
        patients: matches.slice(0, 10).map((p) => ({
          id: p.id,
          name: p.name,
          cpf: p.cpf,
          companyName: p.companyName,
          phone: p.phone,
        })),
      };
    },
  },
  {
    name: "list_providers",
    description: "Lista prestadores ativos do tenant (nome e especialidade).",
    parameters: { type: "object", properties: {} },
    requiredModule: "agenda",
    handler: async (ctx) => {
      const { listAllProviderOptions } = await import("@/lib/assistant/resolve-entities");
      const providers = await listAllProviderOptions(ctx.user.tenantId);
      return {
        count: providers.length,
        providers: providers.map((p) => ({
          id: p.id,
          name: p.label,
          detail: p.detail ?? null,
        })),
      };
    },
  },
  {
    name: "list_procedures",
    description: "Lista procedimentos/serviços do catálogo do tenant.",
    parameters: { type: "object", properties: {} },
    requiredModule: "cadastros",
    handler: async (ctx) => {
      const { listAllProcedureOptions } = await import("@/lib/assistant/resolve-entities");
      const procedures = await listAllProcedureOptions(ctx.user.tenantId);
      return {
        count: procedures.length,
        procedures: procedures.slice(0, 20).map((p) => ({
          id: p.id,
          name: p.label,
          detail: p.detail ?? null,
        })),
      };
    },
  },
];
