import "server-only";
import type { AssistantMessage, AssistantPlan, AssistantToolCall, AssistantToolDefinition } from "@/lib/assistant/types";
import type { SessionUser } from "@/lib/session";

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function extractSearchQuery(text: string): string | null {
  const patterns = [
    /(?:buscar|procurar|encontrar)\s+(?:paciente|benefici[aá]rio|pet|cliente|aluno)?\s*[:\-]?\s*(.+)/i,
    /(?:nome|cpf)\s*[:\-]?\s*(.+)/i,
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

function extractEmail(text: string): string | null {
  const match = text.match(/[\w.+-]+@[\w.-]+\.\w+/);
  return match?.[0] ?? null;
}

function extractPassword(text: string): string | null {
  const match = text.match(/senha\s+(\S+)/i);
  return match?.[1] ?? null;
}

function extractCreateUserArgs(raw: string): Record<string, unknown> | null {
  const email = extractEmail(raw);
  if (!email) return null;
  const password = extractPassword(raw) ?? "bibi123";
  const withoutEmail = raw.replace(email, "").replace(/senha\s+\S+/i, "");
  const nameMatch = withoutEmail.match(/criar\s+usu[aá]rio\s*[:\-]?\s*(.+)/i);
  const name = (nameMatch?.[1] ?? "Novo Usuário").replace(/[,;].*$/, "").trim();
  const roleMatch = raw.match(/\b(prestador|interno|pj|benefici[aá]rio)\b/i);
  const role = (roleMatch?.[1] ?? "PRESTADOR").toUpperCase().replace("Á", "A").replace("Ã", "A");
  return { name, email, password, role };
}

function extractCreatePatientArgs(raw: string): Record<string, unknown> | null {
  const cpfMatch = raw.match(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\d{11}/);
  if (!cpfMatch) return null;
  const nameMatch = raw.match(/(?:cadastrar|criar)\s+(?:paciente|benefici[aá]rio|pet|cliente|aluno)?\s*[:\-]?\s*([^,\d]+)/i);
  const birthMatch = raw.match(/(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/);
  return {
    name: (nameMatch?.[1] ?? "Novo Cadastro").trim(),
    cpf: cpfMatch[0],
    birthDate: birthMatch?.[1] ?? "1990-01-01",
  };
}

function planForRole(
  text: string,
  raw: string,
  role: string,
  toolNames: Set<string>,
): AssistantToolCall[] | null {
  if (role === "PRESTADOR") {
    if (includesAny(text, ["extrato", "receita", "ganho"]) && toolNames.has("get_extrato_summary")) {
      return [{ name: "get_extrato_summary", arguments: { from: extractDateHint(text) ?? "hoje" } }];
    }
    if (includesAny(text, ["paciente", "pet", "cliente", "aluno"]) && toolNames.has("list_my_patients")) {
      const q = extractSearchQuery(raw);
      return [{ name: "list_my_patients", arguments: q ? { search: q } : {} }];
    }
    if (includesAny(text, ["agenda", "consulta", "atendimento", "hoje"]) && toolNames.has("list_my_appointments")) {
      return [{ name: "list_my_appointments", arguments: { date: extractDateHint(text) ?? "hoje" } }];
    }
    if (toolNames.has("get_prestador_dashboard")) {
      return [{ name: "get_prestador_dashboard", arguments: {} }];
    }
  }

  if (role === "PJ") {
    if (includesAny(text, ["fatura", "devedor", "aberto"]) && toolNames.has("get_open_invoices")) {
      return [{ name: "get_open_invoices", arguments: {} }];
    }
    if (includesAny(text, ["benefici", "colaborador", "funcionario"]) && toolNames.has("list_company_beneficiaries")) {
      const q = extractSearchQuery(raw);
      return [{ name: "list_company_beneficiaries", arguments: q ? { search: q } : {} }];
    }
    if (toolNames.has("get_pj_overview")) {
      return [{ name: "get_pj_overview", arguments: {} }];
    }
  }

  if (role === "BENEFICIARIO") {
    if (includesAny(text, ["agendar", "horario", "vaga", "slot"]) && toolNames.has("list_available_slots")) {
      return [{ name: "list_available_slots", arguments: { date: extractDateHint(text) ?? "hoje" } }];
    }
    if (includesAny(text, ["fatura", "boleto", "pagar"]) && toolNames.has("list_my_invoices")) {
      return [{ name: "list_my_invoices", arguments: {} }];
    }
    if (includesAny(text, ["agenda", "consulta", "proximo"]) && toolNames.has("list_my_appointments")) {
      return [{ name: "list_my_appointments", arguments: {} }];
    }
    if (toolNames.has("get_my_overview")) {
      return [{ name: "get_my_overview", arguments: {} }];
    }
  }

  return null;
}

export function planMockAssistant(
  messages: AssistantMessage[],
  tools: AssistantToolDefinition[],
  user: SessionUser,
): AssistantPlan {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const raw = lastUser?.content ?? "";
  const text = raw.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const toolNames = new Set(tools.map((t) => t.name));

  if (!text.trim()) {
    return { toolCalls: [], fallback: "Como posso ajudar? Descreva o que precisa consultar ou executar." };
  }

  if (includesAny(text, ["como ", "como fazer", "como criar", "onde ", "ajuda"]) && toolNames.has("explain_capability")) {
    return { toolCalls: [{ name: "explain_capability", arguments: { topic: raw } }] };
  }

  if (includesAny(text, ["criar usu", "cadastrar usu", "novo usu"]) && toolNames.has("draft_create_user")) {
    const args = extractCreateUserArgs(raw);
    if (args) return { toolCalls: [{ name: "draft_create_user", arguments: args }] };
  }

  if (includesAny(text, ["criar paciente", "cadastrar paciente", "novo paciente", "cadastrar benefici"]) && toolNames.has("draft_create_patient")) {
    const args = extractCreatePatientArgs(raw);
    if (args) return { toolCalls: [{ name: "draft_create_patient", arguments: args }] };
  }

  if (includesAny(text, ["agendar", "marcar consulta", "criar agendamento"]) && toolNames.has("draft_create_appointment")) {
    const timeMatch = raw.match(/(\d{1,2}:\d{2})/);
    return {
      toolCalls: [{
        name: "draft_create_appointment",
        arguments: {
          date: extractDateHint(text) ?? "hoje",
          time: timeMatch?.[1] ?? "09:00",
          patientName: extractSearchQuery(raw) ?? undefined,
        },
      }],
    };
  }

  const rolePlan = planForRole(text, raw, user.role, toolNames);
  if (rolePlan) return { toolCalls: rolePlan };

  if (includesAny(text, ["agendamento", "consulta", "atendimento"]) && toolNames.has("count_appointments")) {
    return { toolCalls: [{ name: "count_appointments", arguments: { date: extractDateHint(text) ?? "hoje" } }] };
  }

  if (includesAny(text, ["receita", "faturamento"]) && toolNames.has("get_revenue_summary")) {
    const dateHint = extractDateHint(text);
    return { toolCalls: [{ name: "get_revenue_summary", arguments: dateHint ? { from: dateHint, to: dateHint } : { from: "hoje" } }] };
  }

  if (includesAny(text, ["devedor", "devendo", "inadimpl"]) && toolNames.has("list_debtors")) {
    return { toolCalls: [{ name: "list_debtors", arguments: { limit: 10 } }] };
  }

  if (includesAny(text, ["dashboard", "kpi", "indicador", "resumo"]) && toolNames.has("get_dashboard_kpis")) {
    return { toolCalls: [{ name: "get_dashboard_kpis", arguments: {} }] };
  }

  if (includesAny(text, ["listar usu", "usuarios", "usuários"]) && toolNames.has("list_users")) {
    return { toolCalls: [{ name: "list_users", arguments: {} }] };
  }

  if (includesAny(text, ["buscar", "procurar", "cpf"]) && toolNames.has("search_patients")) {
    const query = extractSearchQuery(raw);
    if (query) return { toolCalls: [{ name: "search_patients", arguments: { query } }] };
  }

  return {
    toolCalls: [],
    fallback: `Não entendi. Ferramentas disponíveis: ${tools.map((t) => t.name).join(", ")}.`,
  };
}
