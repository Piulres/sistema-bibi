import "server-only";
import type {
  AssistantAction,
  AssistantChatResult,
  AssistantMessage,
  AssistantToolContext,
  AssistantToolTrace,
} from "@/lib/assistant/types";
import type { SessionUser } from "@/lib/session";
import { buildAssistantSystemPrompt } from "@/lib/assistant/context";
import { assertToolPermission, AssistantPermissionError } from "@/lib/assistant/permissions";
import { planMockAssistant } from "@/lib/assistant/provider/mock";
import { findTool, getToolsForUser } from "@/lib/assistant/tools/registry";

function formatToolResult(toolName: string, result: unknown, labels: SessionUser["labels"]): string {
  switch (toolName) {
    case "get_dashboard_kpis": {
      const data = result as {
        generatedAtLabel: string;
        kpis: {
          appointmentsToday: number;
          totalPatients: number;
          totalCompanies: number;
          pendingBillingLabel: string;
          totalInvoicedLabel: string;
          activeSubscriptions: number;
        };
        revenue: {
          invoicedPaidLabel: string;
          invoicedOpenLabel: string;
        };
      };
      return [
        `Indicadores atualizados em ${data.generatedAtLabel}:`,
        `• ${labels.appointment}s hoje: **${data.kpis.appointmentsToday}**`,
        `• Total de ${labels.patients}: ${data.kpis.totalPatients}`,
        `• Empresas: ${data.kpis.totalCompanies}`,
        `• Faturamento pendente (Pay Per Use): ${data.kpis.pendingBillingLabel}`,
        `• Total faturado: ${data.kpis.totalInvoicedLabel}`,
        `• Receita paga: ${data.revenue.invoicedPaidLabel} · Em aberto: ${data.revenue.invoicedOpenLabel}`,
        `• Assinaturas ativas: ${data.kpis.activeSubscriptions}`,
      ].join("\n");
    }
    case "count_appointments": {
      const data = result as {
        dateLabel: string;
        count: number;
        cancelled: number;
        sample: { time: string; patient: string; provider: string; status: string }[];
      };
      const lines = [
        `Em **${data.dateLabel}** há **${data.count}** ${labels.appointment.toLowerCase()}(s) ativo(s)`,
        data.cancelled > 0 ? `(${data.cancelled} cancelado(s))` : "",
      ].filter(Boolean);
      if (data.sample.length > 0) {
        lines.push("", "Próximos:");
        for (const item of data.sample) {
          lines.push(`• ${item.time} — ${item.patient} com ${item.provider} (${item.status})`);
        }
      }
      return lines.join("\n");
    }
    case "get_revenue_summary": {
      const data = result as {
        fromLabel: string;
        toLabel: string;
        invoicedTotalLabel: string;
        paidTotalLabel: string;
        openTotalLabel: string;
        pendingPayPerUseLabel: string;
        invoiceCount: number;
      };
      const period =
        data.fromLabel === data.toLabel
          ? data.fromLabel
          : `${data.fromLabel} a ${data.toLabel}`;
      return [
        `Receita no período **${period}**:`,
        `• Faturado: **${data.invoicedTotalLabel}** (${data.invoiceCount} fatura(s))`,
        `• Pago: ${data.paidTotalLabel}`,
        `• Em aberto: ${data.openTotalLabel}`,
        `• Pay Per Use pendente: ${data.pendingPayPerUseLabel}`,
      ].join("\n");
    }
    case "list_debtors": {
      const data = result as {
        count: number;
        totalLabel: string;
        debtors: { patientName: string; amountLabel: string; detail: string }[];
      };
      if (data.count === 0) {
        return `Não há ${labels.patients.toLowerCase()} com pendências financeiras no momento.`;
      }
      const lines = [
        `Encontrei **${data.count}** pendência(s) — total aproximado: **${data.totalLabel}**`,
        "",
      ];
      for (const debtor of data.debtors) {
        lines.push(`• **${debtor.patientName}** — ${debtor.amountLabel} (${debtor.detail})`);
      }
      return lines.join("\n");
    }
    case "list_users": {
      const data = result as {
        count: number;
        users: { name: string; email: string; role: string }[];
      };
      if (data.count === 0) return "Nenhum usuário encontrado com esses filtros.";
      const lines = [`**${data.count}** usuário(s):`, ""];
      for (const user of data.users) {
        lines.push(`• ${user.name} (${user.email}) — ${user.role}`);
      }
      return lines.join("\n");
    }
    case "search_patients": {
      const data = result as {
        count: number;
        patients: { name: string; cpf: string; companyName: string | null }[];
      };
      if (data.count === 0) return `Nenhum ${labels.patient.toLowerCase()} encontrado.`;
      const lines = [`**${data.count}** resultado(s):`, ""];
      for (const patient of data.patients) {
        lines.push(
          `• **${patient.name}** — CPF ${patient.cpf}${patient.companyName ? ` · ${patient.companyName}` : ""}`,
        );
      }
      return lines.join("\n");
    }
    default:
      return JSON.stringify(result, null, 2);
  }
}

function buildActions(toolName: string, result: unknown): AssistantAction[] {
  if (toolName === "list_debtors") {
    const data = result as {
      debtors: { patientName: string; amountLabel: string; detail: string }[];
    };
    if (data.debtors.length === 0) return [];
    return [
      {
        type: "table",
        title: "Pendências financeiras",
        columns: ["Beneficiário", "Valor", "Detalhe"],
        rows: data.debtors.map((d) => [d.patientName, d.amountLabel, d.detail]),
      },
      { type: "link", label: "Abrir faturamento", href: "/interno" },
    ];
  }

  if (toolName === "count_appointments") {
    return [{ type: "link", label: "Ver agenda", href: "/interno/agenda" }];
  }

  if (toolName === "get_revenue_summary") {
    return [{ type: "link", label: "Ver relatórios", href: "/interno/relatorios" }];
  }

  if (toolName === "get_dashboard_kpis") {
    return [{ type: "link", label: "Dashboard executivo", href: "/interno/dashboard" }];
  }

  if (toolName === "list_users") {
    return [{ type: "link", label: "Cadastros", href: "/interno/cadastros" }];
  }

  return [];
}

export async function runAssistantChat(input: {
  user: SessionUser;
  messages: AssistantMessage[];
  pageContext?: string;
}): Promise<AssistantChatResult> {
  const tools = getToolsForUser(input.user);
  const ctx: AssistantToolContext = { user: input.user, labels: input.user.labels };

  if (tools.length === 0) {
    return {
      message: {
        role: "assistant",
        content: "O assistente não está disponível para seu perfil nesta fase.",
      },
    };
  }

  // System prompt reservado para provider LLM real (fase 4).
  void buildAssistantSystemPrompt(input.user, input.pageContext);

  const plan = planMockAssistant(input.messages, tools);

  if (plan.toolCalls.length === 0) {
    return {
      message: { role: "assistant", content: plan.fallback ?? "Não entendi. Tente reformular." },
    };
  }

  const trace: AssistantToolTrace[] = [];
  const sections: string[] = [];
  let actions: AssistantAction[] = [];

  for (const call of plan.toolCalls) {
    const tool = findTool(tools, call.name);
    if (!tool) {
      trace.push({ name: call.name, ok: false, error: "Ferramenta indisponível" });
      continue;
    }

    try {
      assertToolPermission(input.user, tool);
      const result = await tool.handler(ctx, call.arguments);
      trace.push({ name: call.name, ok: true });
      sections.push(formatToolResult(call.name, result, input.user.labels));
      actions = [...actions, ...buildActions(call.name, result)];
    } catch (error) {
      const message =
        error instanceof AssistantPermissionError
          ? error.message
          : "Erro ao executar a consulta.";
      trace.push({ name: call.name, ok: false, error: message });
      sections.push(message);
    }
  }

  return {
    message: {
      role: "assistant",
      content: sections.join("\n\n") || "Não foi possível obter os dados.",
    },
    actions: actions.length > 0 ? actions : undefined,
    toolTrace: process.env.NODE_ENV === "development" ? trace : undefined,
  };
}
