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
    /(?:para|pro)\s+([A-Za-zÀ-ú][A-Za-zÀ-ú\s.'-]{1,60}?)(?=\s+com\b|\s+amanha|\s+amanhã|\s+hoje|\s+ontem|\s+(?:as|às)\s+|\s+\d{1,2}:\d{2}|\s+\d{1,2}\s*h|$)/i,
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

export function extractProviderName(raw: string): string | undefined {
  const withCom = raw.match(
    /\bcom\s+(?:a\s+|o\s+)?((?:dra?|dr)\.?\s+[A-Za-zÀ-ú][A-Za-zÀ-ú\s.]{1,40}?)(?=\s+amanha|\s+amanhã|\s+hoje|\s+ontem|\s+(?:as|às)\s+|\s+\d{1,2}:\d{2}|\s+\d{1,2}\s*h|$)/i,
  );
  if (withCom?.[1]) return withCom[1].trim();

  const bare = raw.match(
    /\b((?:dra?|dr)\.?\s+[A-Za-zÀ-ú][A-Za-zÀ-ú\s.]{2,40})(?=\s*$|\s+amanha|\s+amanhã|\s+hoje|\s+(?:as|às)\s+|\s+\d)/i,
  );
  return bare?.[1]?.trim();
}

export function extractBarePatientName(raw: string): string | undefined {
  const trimmed = raw.trim().replace(/[?.!]+$/, "");
  const patterns = [
    /^(?:e\s+)?(?:para|pro)\s+(.+)/i,
    /^(?:paciente|benefici[aá]rio|pet|cliente|aluno)\s+(.+)/i,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      return cleanupPersonName(match[1]);
    }
  }
  if (
    /^[A-Za-zÀ-ú][A-Za-zÀ-ú\s.'-]{2,50}$/.test(trimmed) &&
    !/\b(amanha|amanhã|hoje|ontem|agendar|marcar|consulta|dra?|dr)\b/i.test(trimmed)
  ) {
    return trimmed;
  }
  return undefined;
}

function cleanupPersonName(value: string): string {
  return value
    .replace(/\s+com\b.+$/i, "")
    .replace(/\s+(?:amanha|amanhã|hoje|ontem)\b.+$/i, "")
    .replace(/\s+(?:as|às)\s+\d.+$/i, "")
    .trim();
}

export function extractTimeOptional(text: string): string | undefined {
  const m = text.match(/\b(\d{1,2}:\d{2})\b/);
  if (m) return m[1];
  const h = text.match(/\b(?:as|às)\s*(\d{1,2})\s*(?:h|horas?)\b/i);
  if (h) return `${h[1].padStart(2, "0")}:00`;
  const bareH = text.match(/\b(\d{1,2})\s*h\b/i);
  if (bareH) return `${bareH[1].padStart(2, "0")}:00`;
  return undefined;
}

export function extractProcedureName(raw: string): string | undefined {
  const patterns = [
    /(?:procedimento|servi[cç]o|sess[aã]o)\s+([^,]+?)(?=\s+com\b|\s+para\b|\s+pro\b|\s+amanha|\s+amanhã|\s+hoje|$)/i,
    /(?:consulta)\s+([a-zà-ú][a-zà-ú\s]{2,40}?)(?=\s+com\b|\s+para\b|\s+pro\b|\s+amanha|\s+amanhã|$)/i,
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) {
      const value = match[1].trim();
      if (!/^(para|pro|com|de|do|da)$/i.test(value)) return value;
    }
  }
  return undefined;
}

export function extractCreateAppointmentArgs(raw: string): Record<string, unknown> {
  const dateHint = extractDateHint(raw);
  const time = extractTimeOptional(raw);
  const patientName = extractSearchQuery(raw) ?? extractBarePatientName(raw);
  const providerName = extractProviderName(raw);
  const procedureName = extractProcedureName(raw);
  return {
    ...(patientName ? { patientName } : {}),
    ...(providerName ? { providerName } : {}),
    ...(procedureName ? { procedureName } : {}),
    ...(dateHint ? { date: dateHint } : {}),
    ...(time ? { time } : {}),
  };
}

export function extractIncrementalArgs(tool: string, raw: string): Record<string, unknown> {
  switch (tool) {
    case "draft_create_appointment":
    case "draft_book_appointment":
      return extractCreateAppointmentArgs(raw);
    case "draft_create_user": {
      const email = extractEmail(raw);
      const password = extractPassword(raw);
      const name =
        extractBarePatientName(raw) ??
        raw.match(/(?:nome|chamado)\s+([A-Za-zÀ-ú][A-Za-zÀ-ú\s.'-]{2,60})/i)?.[1]?.trim();
      return {
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
        ...(password ? { password } : {}),
        ...(extractRole(raw) !== "PRESTADOR" || /\b(prestador|interno|pj|benefici)/i.test(raw)
          ? { role: extractRole(raw) }
          : {}),
      };
    }
    case "draft_create_patient": {
      const full = extractCreatePatientArgs(raw);
      if (full) return full;
      const name = extractBarePatientName(raw);
      return name ? { name } : {};
    }
    default:
      return {};
  }
}

export function parseChoiceSelection(
  raw: string,
  options: { id: string; label: string; detail?: string }[],
): string | null {
  const trimmed = raw.trim();
  if (!trimmed || options.length === 0) return null;

  const numberMatch = trimmed.match(/^(?:op[cç][aã]o\s*)?#?(\d+)\.?(?:\s|$)/i);
  if (numberMatch) {
    const index = Number(numberMatch[1]) - 1;
    if (index >= 0 && index < options.length) return options[index]!.id;
  }

  const norm = normalizeMockText(trimmed);
  const exact = options.filter((option) => normalizeMockText(option.label) === norm);
  if (exact.length === 1) return exact[0]!.id;

  const partial = options.filter((option) => {
    const label = normalizeMockText(option.label);
    return label.includes(norm) || norm.includes(label);
  });
  if (partial.length === 1) return partial[0]!.id;

  return null;
}

export function isDraftContinuation(
  raw: string,
  lastTool: string | null,
  hasActiveDraft: boolean,
  hasPendingChoice = false,
): boolean {
  if (hasPendingChoice || hasActiveDraft) return true;
  if (!lastTool?.startsWith("draft_")) return false;

  const t = normalizeMockText(raw);
  const trimmed = raw.trim();
  if (extractDateHint(raw)) return true;
  if (extractTimeOptional(raw)) return true;
  if (extractProviderName(raw)) return true;
  if (extractBarePatientName(raw)) return true;
  if (extractSearchQuery(raw)) return true;
  if (extractEmail(raw)) return true;
  if (/\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\d{11}/.test(raw)) return true;
  if (/^(e\s+)?(para|pro)\s+/i.test(raw.trim())) return true;
  if (/\b(com\s+)?(dra?|dr)\.?\s+[a-z]/i.test(raw)) return true;
  if (/^(nome|email|e-mail|senha|cpf)\b/i.test(t)) return true;
  if (/^\d{1,2}\.?$/.test(trimmed)) return true;
  return isFollowUpPhrase(t);
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
  return extractTimeOptional(text) ?? "09:00";
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
