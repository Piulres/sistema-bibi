import type { NicheId } from "@/lib/niche/types";

/** Papéis genéricos de equipe no atendimento — agnóstico de nicho. */
export const TEAM_ROLES = [
  "ANESTESISTA",
  "TECNICO_ENFERMAGEM",
  "ASSISTENTE",
  "PARALEGAL",
  "OUTRO",
] as const;

export type TeamRole = (typeof TEAM_ROLES)[number];

export function isTeamRole(value: string): value is TeamRole {
  return (TEAM_ROLES as readonly string[]).includes(value);
}

export type TeamRoleRequirement = {
  role: TeamRole;
  required: boolean;
  minCount?: number;
};

export function parseTeamRoleRequirements(json: string | null | undefined): TeamRoleRequirement[] {
  if (!json?.trim()) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is TeamRoleRequirement =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as TeamRoleRequirement).role === "string" &&
          isTeamRole((item as TeamRoleRequirement).role) &&
          typeof (item as TeamRoleRequirement).required === "boolean",
      )
      .map((item) => ({
        role: item.role,
        required: item.required,
        minCount: typeof item.minCount === "number" ? item.minCount : 1,
      }));
  } catch {
    return [];
  }
}

export function serializeTeamRoleRequirements(requirements: TeamRoleRequirement[]): string {
  return JSON.stringify(requirements);
}

/** Rótulos de papel por nicho (UI). */
const ROLE_LABELS: Record<NicheId, Record<TeamRole, string>> = {
  MEDICAL: {
    ANESTESISTA: "Anestesista",
    TECNICO_ENFERMAGEM: "Técnico(a) de enfermagem",
    ASSISTENTE: "Assistente",
    PARALEGAL: "Paralegal",
    OUTRO: "Outro profissional",
  },
  DENTAL: {
    ANESTESISTA: "Sedação / anestesista",
    TECNICO_ENFERMAGEM: "Auxiliar de consultório",
    ASSISTENTE: "Assistente",
    PARALEGAL: "Paralegal",
    OUTRO: "Outro profissional",
  },
  VET: {
    ANESTESISTA: "Anestesista veterinário",
    TECNICO_ENFERMAGEM: "Técnico veterinário",
    ASSISTENTE: "Auxiliar",
    PARALEGAL: "Paralegal",
    OUTRO: "Outro profissional",
  },
  LEGAL: {
    ANESTESISTA: "Consultor especializado",
    TECNICO_ENFERMAGEM: "Assistente jurídico",
    ASSISTENTE: "Estagiário(a)",
    PARALEGAL: "Paralegal",
    OUTRO: "Outro profissional",
  },
  SPA: {
    ANESTESISTA: "Especialista",
    TECNICO_ENFERMAGEM: "Assistente de sala",
    ASSISTENTE: "Recepcionista clínico",
    PARALEGAL: "Paralegal",
    OUTRO: "Outro profissional",
  },
  EDUCATION: {
    ANESTESISTA: "Especialista convidado",
    TECNICO_ENFERMAGEM: "Monitor(a)",
    ASSISTENTE: "Assistente pedagógico",
    PARALEGAL: "Paralegal",
    OUTRO: "Outro profissional",
  },
  CONSTRUCTION: {
    ANESTESISTA: "Especialista técnico",
    TECNICO_ENFERMAGEM: "Técnico de obra",
    ASSISTENTE: "Auxiliar de campo",
    PARALEGAL: "Paralegal",
    OUTRO: "Outro profissional",
  },
};

export function teamRoleLabel(role: string, niche: NicheId = "MEDICAL"): string {
  if (!isTeamRole(role)) return role;
  return ROLE_LABELS[niche][role] ?? ROLE_LABELS.MEDICAL[role];
}

/** Procedimento PPU padrão para cobrança por papel (código no catálogo). */
export const TEAM_ROLE_FEE_PROCEDURE_CODES: Partial<Record<TeamRole, string>> = {
  ANESTESISTA: "EQP-ANEST",
  TECNICO_ENFERMAGEM: "EQP-ENF-TEC",
  ASSISTENTE: "EQP-ASSIST",
};

/** Papéis disponíveis por nicho (subset relevante). */
export function teamRolesForNiche(niche: NicheId): TeamRole[] {
  switch (niche) {
    case "LEGAL":
      return ["PARALEGAL", "ASSISTENTE", "OUTRO"];
    case "CONSTRUCTION":
      return ["TECNICO_ENFERMAGEM", "ASSISTENTE", "OUTRO"];
    case "SPA":
    case "EDUCATION":
      return ["ASSISTENTE", "TECNICO_ENFERMAGEM", "OUTRO"];
    case "VET":
    case "DENTAL":
    case "MEDICAL":
    default:
      return ["ANESTESISTA", "TECNICO_ENFERMAGEM", "ASSISTENTE", "OUTRO"];
  }
}

/** Heurística para sugerir usuários elegíveis por papel. */
export function matchesTeamRole(
  user: { specialty?: string | null; councilType?: string | null; role: string },
  teamRole: TeamRole,
): boolean {
  const specialty = (user.specialty ?? "").toLowerCase();
  switch (teamRole) {
    case "ANESTESISTA":
      return specialty.includes("anestes");
    case "TECNICO_ENFERMAGEM":
      return (
        user.councilType === "COREN" ||
        specialty.includes("enferm") ||
        specialty.includes("técnico") ||
        specialty.includes("tecnico")
      );
    case "ASSISTENTE":
      return specialty.includes("assist") || specialty.includes("auxiliar");
    case "PARALEGAL":
      return specialty.includes("paralegal") || specialty.includes("jurídic");
    default:
      return user.role === "PRESTADOR" || user.role === "INTERNO";
  }
}
