import "server-only";
import type {
  AssistantMessage,
  AssistantToolCall,
  AssistantToolDefinition,
} from "@/lib/assistant/types";

type MockPlan = {
  toolCalls: AssistantToolCall[];
  fallback?: string;
};

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function extractSearchQuery(text: string): string | null {
  const patterns = [
    /(?:buscar|procurar|encontrar)\s+(?:paciente|benefici[aá]rio|pet|cliente|aluno)?\s*[:\-]?\s*(.+)/i,
    /(?:nome|cpf)\s*[:\-]?\s*(.+)/i,
    /paciente\s+([a-zà-ú\s]{2,})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim().replace(/[?.!]+$/, "");
  }
  return null;
}

function extractDateHint(text: string): string | undefined {
  if (includesAny(text, ["ontem"])) return "ontem";
  if (includesAny(text, ["amanhã", "amanha"])) return "amanhã";
  if (includesAny(text, ["hoje"])) return "hoje";

  const iso = text.match(/\d{4}-\d{2}-\d{2}/);
  if (iso) return iso[0];

  const br = text.match(/\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/);
  if (br) return br[0];

  return undefined;
}

/**
 * Provider mock — roteia intenções por palavras-chave para tool calls.
 * Substitui LLM em dev/CI; produção usará netlify-gateway (fase 4).
 */
export function planMockAssistant(
  messages: AssistantMessage[],
  tools: AssistantToolDefinition[],
): MockPlan {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const text = (lastUser?.content ?? "").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const toolNames = new Set(tools.map((t) => t.name));

  if (!text.trim()) {
    return {
      toolCalls: [],
      fallback: "Como posso ajudar? Pergunte sobre agendamentos, receita, devedores ou indicadores do dashboard.",
    };
  }

  if (includesAny(text, ["agendamento", "consulta", "atendimento", "aula", "sessao"]) && toolNames.has("count_appointments")) {
    return {
      toolCalls: [{ name: "count_appointments", arguments: { date: extractDateHint(text) ?? "hoje" } }],
    };
  }

  if (includesAny(text, ["receita", "faturamento", "faturado", "fatura"]) && toolNames.has("get_revenue_summary")) {
    const dateHint = extractDateHint(text);
    return {
      toolCalls: [
        {
          name: "get_revenue_summary",
          arguments: dateHint ? { from: dateHint, to: dateHint } : { from: "hoje" },
        },
      ],
    };
  }

  if (includesAny(text, ["devedor", "devendo", "pendente", "inadimpl", "cobranca", "cobrança"]) && toolNames.has("list_debtors")) {
    return { toolCalls: [{ name: "list_debtors", arguments: { limit: 10 } }] };
  }

  if (includesAny(text, ["dashboard", "kpi", "indicador", "resumo", "visao geral", "visão geral"]) && toolNames.has("get_dashboard_kpis")) {
    return { toolCalls: [{ name: "get_dashboard_kpis", arguments: {} }] };
  }

  if (includesAny(text, ["usuario", "usuário", "usuarios", "usuários", "prestador", "interno"]) && toolNames.has("list_users")) {
    const roleMatch = text.match(/\b(prestador|interno|pj|beneficiario|beneficiário)\b/);
    return {
      toolCalls: [
        {
          name: "list_users",
          arguments: roleMatch ? { role: roleMatch[1].toUpperCase().replace("Á", "A") } : {},
        },
      ],
    };
  }

  if (
    includesAny(text, ["buscar", "procurar", "encontrar", "cpf"]) ||
    (includesAny(text, ["paciente", "beneficiario", "beneficiário", "pet", "cliente", "aluno"]) && text.length > 12)
  ) {
    if (toolNames.has("search_patients")) {
      const query = extractSearchQuery(lastUser?.content ?? "");
      if (query && query.length >= 2) {
        return { toolCalls: [{ name: "search_patients", arguments: { query } }] };
      }
    }
  }

  const available = tools.map((t) => t.name).join(", ");
  return {
    toolCalls: [],
    fallback: `Posso ajudar com: agendamentos de hoje, receita, devedores, indicadores do dashboard, usuários e busca de pacientes. Ferramentas disponíveis para seu perfil: ${available}.`,
  };
}
