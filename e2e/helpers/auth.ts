import type { Page } from "@playwright/test";

export type PortalKey = "prestador" | "interno" | "pj" | "beneficiario";

const LOGIN_PATHS: Record<PortalKey, string> = {
  prestador: "/login",
  interno: "/interno/login",
  pj: "/pj/login",
  beneficiario: "/beneficiario/login",
};

const DASHBOARD_PATTERNS: Record<PortalKey, RegExp> = {
  prestador: /\/prestador/,
  interno: /\/interno\/dashboard/,
  pj: /\/pj$/,
  beneficiario: /\/beneficiario$/,
};

/** Preenche credenciais demo e aguarda redirecionamento pós-login. */
export async function loginAs(
  page: Page,
  portal: PortalKey,
  email: string,
  password = "bibi123",
): Promise<void> {
  await page.goto(LOGIN_PATHS[portal]);
  await page.getByLabel(/e-mail/i).fill(email);
  await page.getByLabel(/senha/i).fill(password);
  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForURL(DASHBOARD_PATTERNS[portal]);
}

/** Abas do portal interno (`InternoNav` / `NavTabs`) — evita colisão com quick links do dashboard. */
export function internoNav(page: Page) {
  return page.getByRole("navigation", { name: "Navegação por abas" });
}
