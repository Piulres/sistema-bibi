export const ROLES = {
  PRESTADOR: "PRESTADOR",
  INTERNO: "INTERNO",
  PJ: "PJ",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Mapeia cada portal ao seu role, rota de login e dashboard. */
export const PORTALS = {
  prestador: {
    role: ROLES.PRESTADOR,
    label: "Portal do Prestador",
    loginPath: "/login",
    dashboardPath: "/prestador",
  },
  interno: {
    role: ROLES.INTERNO,
    label: "Portal Interno",
    loginPath: "/interno/login",
    dashboardPath: "/interno",
  },
  pj: {
    role: ROLES.PJ,
    label: "Portal da Empresa (PJ)",
    loginPath: "/pj/login",
    dashboardPath: "/pj",
  },
} as const;

export type PortalKey = keyof typeof PORTALS;

export function portalForRole(role: string): (typeof PORTALS)[PortalKey] | undefined {
  return Object.values(PORTALS).find((p) => p.role === role);
}
