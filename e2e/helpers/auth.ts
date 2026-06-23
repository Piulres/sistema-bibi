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
  beneficiario: /\/beneficiario\/(resumo|agendar|agenda|consumo|faturas|assinatura|prontuario|historico)/,
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

/** Abas do portal interno em desktop (≥ lg). */
export function internoNav(page: Page) {
  return page.getByRole("navigation", { name: "Navegação por abas" });
}

/** Menu drawer do interno em mobile/tablet (abaixo de lg / 1024px). */
export function internoNavDrawer(page: Page) {
  return page.getByRole("navigation", { name: "Módulos internos" });
}

/**
 * Retorna o escopo de links do interno — abas desktop ou drawer mobile (abre se necessário).
 */
export async function openInternoNav(page: Page) {
  const desktop = internoNav(page);
  if (await desktop.isVisible()) {
    return desktop;
  }
  const drawer = internoNavDrawer(page);
  if (!(await drawer.isVisible())) {
    await page.locator(".lg\\:hidden").getByRole("button").first().click();
  }
  return drawer;
}

/** Conteúdo principal de uma página de portal (evita texto oculto no header/nav). */
export function portalMain(page: Page) {
  return page.locator(".portal-page-content");
}
