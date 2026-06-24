import "server-only";
import type { NicheLabels } from "@/lib/niche/types";

export const DRAFT_TOOL_NAMES = new Set([
  "draft_create_user",
  "draft_create_patient",
  "draft_create_appointment",
  "draft_book_appointment",
]);

export function isDraftToolName(tool: string | null | undefined): boolean {
  return Boolean(tool && DRAFT_TOOL_NAMES.has(tool));
}

export type OperationDraftArgs = Record<string, unknown>;

export function mergeDraftArgs(
  existing: OperationDraftArgs,
  incoming: OperationDraftArgs,
): OperationDraftArgs {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    if (value === undefined || value === null || value === "") continue;
    merged[key] = value;
  }
  return merged;
}

export function stripDraftMeta(args: OperationDraftArgs): OperationDraftArgs {
  return args;
}

type AppointmentArgs = {
  patientName?: string;
  providerName?: string;
  date?: string;
  time?: string;
};

export function getMissingFieldsForTool(
  tool: string,
  args: OperationDraftArgs,
): string[] {
  switch (tool) {
    case "draft_create_appointment":
    case "draft_book_appointment": {
      const data = args as AppointmentArgs;
      const missing: string[] = [];
      if (!data.patientName?.trim() && tool === "draft_create_appointment") {
        missing.push("patientName");
      }
      if (!data.providerName?.trim()) missing.push("providerName");
      if (!data.date?.trim()) missing.push("date");
      if (!data.time?.trim()) missing.push("time");
      return missing;
    }
    case "draft_create_user": {
      const missing: string[] = [];
      const data = args as { name?: string; email?: string; password?: string; role?: string };
      if (!data.name?.trim()) missing.push("name");
      if (!data.email?.trim()) missing.push("email");
      if (!data.password?.trim()) missing.push("password");
      if (!data.role?.trim()) missing.push("role");
      return missing;
    }
    case "draft_create_patient": {
      const missing: string[] = [];
      const data = args as { name?: string; cpf?: string; birthDate?: string };
      if (!data.name?.trim()) missing.push("name");
      if (!data.cpf?.trim()) missing.push("cpf");
      if (!data.birthDate?.trim()) missing.push("birthDate");
      return missing;
    }
    default:
      return [];
  }
}

const FIELD_LABELS: Record<string, Record<string, string>> = {
  draft_create_appointment: {
    patientName: "patient",
    providerName: "provider",
    date: "date",
    time: "time",
  },
  draft_book_appointment: {
    providerName: "provider",
    date: "date",
    time: "time",
  },
  draft_create_user: {
    name: "name",
    email: "email",
    password: "password",
    role: "role",
  },
  draft_create_patient: {
    name: "name",
    cpf: "cpf",
    birthDate: "birthDate",
  },
};

export function buildDraftGuidance(
  tool: string,
  missing: string[],
  labels: NicheLabels,
  partial: Record<string, string>,
): string {
  const prompts: Record<string, string> = {
    patientName: `Para quem é a ${labels.appointment.toLowerCase()}? Informe o nome do ${labels.patient.toLowerCase()}.`,
    providerName: `Com qual ${labels.provider.toLowerCase()}? Ex.: *Dra. Helena*.`,
    procedureName: `Qual ${labels.procedure.toLowerCase()}? Ex.: *consulta clínica*, *eletrocardiograma*.`,
    date: "Para qual data? Ex.: *amanhã*, *25/06/2026*.",
    time: "Qual horário? Ex.: *15:30* ou *às 15h*.",
    name: "Qual o nome completo?",
    email: "Qual o e-mail de login?",
    password: "Qual a senha inicial? (ou diga *senha bibi123*)",
    role: "Qual o perfil? *prestador*, *interno*, *pj* ou *beneficiário*.",
    cpf: "Qual o CPF?",
    birthDate: "Qual a data de nascimento? Ex.: *15/03/1990*.",
  };

  const lines: string[] = [];
  if (Object.keys(partial).length > 0) {
    lines.push("Até agora tenho:");
    for (const [key, value] of Object.entries(partial)) {
      lines.push(`• ${key}: ${value}`);
    }
    lines.push("");
  }

  const next = missing[0];
  const fieldKey = FIELD_LABELS[tool]?.[next ?? ""] ?? next;
  const question = next ? prompts[next] : "Pode detalhar um pouco mais?";

  lines.push(question ?? "Pode detalhar um pouco mais?");

  if (missing.length > 1) {
    const rest = missing
      .slice(1)
      .map((m) => prompts[m] ?? m)
      .join(" · ");
    lines.push(`\nDepois ainda preciso de: ${rest}`);
  }

  if (tool === "draft_create_appointment" && fieldKey) {
    lines.push(
      `\n_Dica: você pode enviar tudo de uma vez — *Agendar para João Pereira com Dra Helena amanhã às 15:30*._`,
    );
  }

  return lines.join("\n");
}

export function formatPartialSummary(
  tool: string,
  args: OperationDraftArgs,
  labels: NicheLabels,
): Record<string, string> {
  switch (tool) {
    case "draft_create_appointment":
    case "draft_book_appointment": {
      const data = args as AppointmentArgs & { procedureName?: string };
      const partial: Record<string, string> = {};
      if (data.patientName) partial[labels.patient] = data.patientName;
      if (data.providerName) partial[labels.provider] = data.providerName;
      if (data.procedureName) partial[labels.procedure] = data.procedureName;
      if (data.date) partial.Data = data.date;
      if (data.time) partial.Horário = data.time;
      return partial;
    }
    case "draft_create_user": {
      const data = args as { name?: string; email?: string; role?: string };
      const partial: Record<string, string> = {};
      if (data.name) partial.Nome = data.name;
      if (data.email) partial["E-mail"] = data.email;
      if (data.role) partial.Perfil = data.role;
      return partial;
    }
    case "draft_create_patient": {
      const data = args as { name?: string; cpf?: string; birthDate?: string };
      const partial: Record<string, string> = {};
      if (data.name) partial.Nome = data.name;
      if (data.cpf) partial.CPF = data.cpf;
      if (data.birthDate) partial.Nascimento = data.birthDate;
      return partial;
    }
    default:
      return {};
  }
}

export function buildResolveErrorGuidance(
  tool: string,
  error: string,
  args: OperationDraftArgs,
  labels: NicheLabels,
): string {
  const partial = formatPartialSummary(tool, args, labels);
  const partialBlock =
    Object.keys(partial).length > 0
      ? `\n\nAté agora:\n${Object.entries(partial)
          .map(([k, v]) => `• ${k}: ${v}`)
          .join("\n")}`
      : "";

  if (error.includes(labels.patient) || error.includes("Paciente")) {
    return `${error}${partialBlock}\n\nConfira o nome ou busque antes: *buscar paciente João*.`;
  }
  if (error.includes(labels.provider) || error.includes("Prestador")) {
    return `${error}${partialBlock}\n\nInforme o nome do ${labels.provider.toLowerCase()}, ex.: *com Dra. Helena*.`;
  }
  return `${error}${partialBlock}`;
}
