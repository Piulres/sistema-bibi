import { normalizeMockText } from "@/lib/assistant/provider/mock-normalize";

export function extractDateHint(text: string): string | undefined {
  const t = normalizeMockText(text);
  if (/\bontem\b/.test(t)) return "ontem";
  if (/\bamanha\b/.test(t)) return "amanhã";
  if (/\bhoje\b/.test(t)) return "hoje";
  if (/\bessa semana\b|\besta semana\b|\bsemana atual\b/.test(t)) return "hoje";
  if (/\bmes passado\b|\bmês passado\b/.test(t)) return "ontem";

  const iso = text.match(/\d{4}-\d{2}-\d{2}/);
  if (iso) return iso[0];

  const br = text.match(/\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/);
  if (br) return br[0];

  const rel = text.match(/\b(em|dia|data)\s+(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i);
  if (rel?.[2]) return rel[2];

  return undefined;
}

export function extractSearchQuery(raw: string): string | null {
  const patterns = [
    /(?:buscar|procurar|encontrar|pesquisar|localizar)\s+(?:o\s+|a\s+)?(?:paciente|benefici[aá]rio|pet|cliente|aluno|usuario|usu[aá]rio|pessoa)?\s*[:\-]?\s*(.+)/i,
    /(?:nome|cpf)\s*(?:do|da|de)?\s*[:\-]?\s*(.+)/i,
    /(?:paciente|benefici[aá]rio|pet|cliente|aluno)\s+(?:chamado|nome|de nome)?\s*[:\-]?\s*(.+)/i,
    /(?:quem e|quem é)\s+(.+)/i,
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) {
      const q = match[1].trim().replace(/[?.!]+$/, "");
      if (q.length >= 2) return q;
    }
  }
  return null;
}

export function extractEmail(text: string): string | null {
  const match = text.match(/[\w.+-]+@[\w.-]+\.\w+/);
  return match?.[0] ?? null;
}

export function extractPassword(text: string): string | null {
  const patterns = [
    /senha\s*[:\-]?\s*(\S+)/i,
    /password\s*[:\-]?\s*(\S+)/i,
    /pass\s*[:\-]?\s*(\S+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

export function extractRole(text: string): string {
  const roleMatch = text.match(
    /\b(prestador|medico|médico|doutor|doutora|veterinario|veterinário|interno|admin|administrador|pj|empresa|rh|beneficiario|beneficiário|tutor|aluno|cliente)\b/i,
  );
  if (!roleMatch) return "PRESTADOR";
  const r = normalizeMockText(roleMatch[1]);
  const map: Record<string, string> = {
    prestador: "PRESTADOR",
    medico: "PRESTADOR",
    doutor: "PRESTADOR",
    doutora: "PRESTADOR",
    veterinario: "PRESTADOR",
    interno: "INTERNO",
    admin: "INTERNO",
    administrador: "INTERNO",
    pj: "PJ",
    empresa: "PJ",
    rh: "PJ",
    beneficiario: "BENEFICIARIO",
    tutor: "BENEFICIARIO",
    aluno: "BENEFICIARIO",
    cliente: "BENEFICIARIO",
  };
  return map[r] ?? "PRESTADOR";
}

export function extractCreateUserArgs(raw: string): Record<string, unknown> | null {
  const email = extractEmail(raw);
  if (!email) return null;
  const password = extractPassword(raw) ?? "bibi123";
  const withoutEmail = raw.replace(email, "").replace(/senha\s+\S+/i, "");
  const namePatterns = [
    /(?:criar|cadastrar|adicionar|novo|registrar)\s+usu[aá]rio\s*[:\-]?\s*(.+)/i,
    /usu[aá]rio\s+(?:chamado|nome)\s*[:\-]?\s*(.+)/i,
  ];
  let name = "Novo Usuário";
  for (const p of namePatterns) {
    const m = withoutEmail.match(p);
    if (m?.[1]) {
      name = m[1].replace(/[,;].*$/, "").trim();
      break;
    }
  }
  return { name, email, password, role: extractRole(raw) };
}

export function extractCreatePatientArgs(raw: string): Record<string, unknown> | null {
  const cpfMatch = raw.match(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\d{11}/);
  if (!cpfMatch) return null;
  const namePatterns = [
    /(?:cadastrar|criar|adicionar|novo|registrar)\s+(?:paciente|benefici[aá]rio|pet|cliente|aluno|tutor)?\s*[:\-]?\s*([^,\d]+)/i,
    /(?:paciente|benefici[aá]rio)\s+(?:chamado|nome)\s*[:\-]?\s*([^,\d]+)/i,
  ];
  let name = "Novo Cadastro";
  for (const p of namePatterns) {
    const m = raw.match(p);
    if (m?.[1]) {
      name = m[1].trim();
      break;
    }
  }
  const birthMatch = raw.match(/(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/);
  return {
    name,
    cpf: cpfMatch[0],
    birthDate: birthMatch?.[1] ?? "1990-01-01",
  };
}

export function extractTime(text: string): string {
  const m = text.match(/\b(\d{1,2}:\d{2})\b/);
  if (m) return m[1];
  const h = text.match(/\b(?:as|às|as)\s*(\d{1,2})\s*(?:h|horas?)\b/i);
  if (h) return `${h[1].padStart(2, "0")}:00`;
  return "09:00";
}

export function defaultDateArg(text: string): string {
  return extractDateHint(text) ?? "hoje";
}

export function dateRangeFromText(text: string): { from?: string; to?: string } {
  const hint = extractDateHint(text);
  if (hint) return { from: hint, to: hint };
  if (/\bmes\b|\bmês\b|\mmensal\b/.test(normalizeMockText(text))) {
    return { from: "hoje" };
  }
  return { from: "hoje" };
}

/** Confirma se texto parece pergunta de follow-up curta. */
export function isFollowUpPhrase(text: string): boolean {
  const t = normalizeMockText(text);
  return (
    /^(e|mas|ok|entao|então)\s/.test(t) ||
    /^(e\s+)?(ontem|hoje|amanha)$/.test(t) ||
    t.length < 28
  );
}

export function followUpDate(text: string): string | undefined {
  return extractDateHint(text);
}
