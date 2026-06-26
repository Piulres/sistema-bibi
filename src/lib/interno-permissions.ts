/** Módulos do portal interno para RBAC granular. */
export const INTERNO_MODULES = [
  "dashboard",
  "billing",
  "agenda",
  "cadastros",
  "estoque",
  "crm",
  "projetos",
  "subscriptions",
  "comunicacao",
  "relatorios",
  "auditoria",
  "branding",
  "integracoes",
  "seguranca",
] as const;

export type InternoModule = (typeof INTERNO_MODULES)[number];

/** internoProfile: ADMIN | FATURAMENTO | RECEPCAO | READONLY */
export const INTERNO_PROFILES = {
  ADMIN: [...INTERNO_MODULES],
  FATURAMENTO: ["dashboard", "billing", "subscriptions", "relatorios", "auditoria", "projetos"],
  RECEPCAO: ["dashboard", "agenda", "cadastros", "estoque", "comunicacao", "projetos"],
  READONLY: ["dashboard", "relatorios", "auditoria"],
} as const satisfies Record<string, readonly InternoModule[]>;

export type InternoProfile = keyof typeof INTERNO_PROFILES;

const PROFILE_SET = new Set<string>(Object.keys(INTERNO_PROFILES));

export function isInternoProfile(value: string): value is InternoProfile {
  return PROFILE_SET.has(value);
}

/** null/undefined/inválido = READONLY (menor privilégio). */
export function resolveInternoPermissions(
  role: string,
  internoProfile: string | null | undefined,
): InternoModule[] {
  if (role !== "INTERNO") return [];
  if (!internoProfile || !isInternoProfile(internoProfile)) {
    return [...INTERNO_PROFILES.READONLY];
  }
  return [...INTERNO_PROFILES[internoProfile]];
}

export function hasInternoPermission(
  role: string,
  internoProfile: string | null | undefined,
  module: InternoModule,
): boolean {
  return resolveInternoPermissions(role, internoProfile).includes(module);
}

export function isInternoAdmin(
  role: string,
  internoProfile: string | null | undefined,
): boolean {
  if (role !== "INTERNO") return false;
  return internoProfile === "ADMIN";
}

export function internoProfileLabel(profile: string | null | undefined): string {
  switch (profile) {
    case "FATURAMENTO":
      return "Faturamento";
    case "RECEPCAO":
      return "Recepção";
    case "READONLY":
      return "Somente leitura";
    case "ADMIN":
      return "Administrador";
    default:
      return "Somente leitura (padrão)";
  }
}
