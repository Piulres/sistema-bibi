import { expect, type Page } from "@playwright/test";

export type PortalKey = "prestador" | "interno" | "pj" | "beneficiario";

const ALL_PORTALS: PortalKey[] = ["prestador", "interno", "pj", "beneficiario"];
const ONBOARDING_VERSION = 3;

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

/** Evita tour guiado auto-iniciado (backdrop intercepta cliques no CI). */
export async function skipOnboardingTours(page: Page): Promise<void> {
  await page.addInitScript(
    ({ portals, version }) => {
      const key = "bibi_onboarding";
      let state: {
        routes?: Record<string, { completed: boolean; version: number; dismissed?: boolean }>;
      } & Record<string, { completed: boolean; version: number; completedAt: string }> = {};
      try {
        state = JSON.parse(localStorage.getItem(key) || "{}") as typeof state;
      } catch {
        state = {};
      }
      const completedAt = new Date().toISOString();
      for (const portal of portals) {
        state[portal] = { completed: true, version, completedAt };
      }
      state.routes = state.routes ?? {};
      const routeKeys = [
        "interno:billing",
        "interno:agenda",
        "interno:cadastros",
        "interno:seguranca",
        "interno:cliente-360",
        "prestador:atendimento",
        "beneficiario:faturas",
        "beneficiario:agendar",
        "pj:main",
      ];
      for (const routeKey of routeKeys) {
        state.routes[routeKey] = { completed: true, version, dismissed: false };
      }
      localStorage.setItem(key, JSON.stringify(state));
    },
    { portals: ALL_PORTALS, version: ONBOARDING_VERSION },
  );
}

/** Fecha tour se ainda estiver visível após navegação. */
export async function dismissOnboardingIfVisible(page: Page): Promise<void> {
  const root = page.locator(".onboarding-root");
  if (await root.isVisible().catch(() => false)) {
    await page.locator(".onboarding-close").click();
    await expect(root).toHaveCount(0, { timeout: 5000 });
  }
}

/** Preenche credenciais demo e aguarda redirecionamento pós-login. */
export async function loginAs(
  page: Page,
  portal: PortalKey,
  email: string,
  password = "bibi123",
  tenantSlug?: string,
): Promise<void> {
  await skipOnboardingTours(page);
  const loginPath = tenantSlug
    ? `${LOGIN_PATHS[portal]}?tenant=${encodeURIComponent(tenantSlug)}`
    : LOGIN_PATHS[portal];
  await page.goto(loginPath);
  await page.getByLabel(/e-mail/i).fill(email);
  await page.getByLabel(/senha/i).fill(password);
  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForURL(DASHBOARD_PATTERNS[portal]);
  await dismissOnboardingIfVisible(page);
}

/** Link de módulo interno por rota (estável entre nichos / labels dinâmicos). */
export function internoNavLink(page: Page, href: string) {
  return page
    .getByRole("navigation", { name: "Navegação por abas" })
    .locator(`a[href="${href}"]`);
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
  if (await drawer.isVisible()) {
    return drawer;
  }
  await page.getByRole("button", { name: /navegação/i }).click();
  await expect(drawer).toBeVisible();
  return drawer;
}

/**
 * Confere presença de um módulo no portal-nav desktop, incluindo o menu **Mais**.
 */
export async function expectInternoNavHref(page: Page, href: string, present: boolean) {
  await openInternoNav(page);
  const desktop = internoNav(page);
  if (await desktop.isVisible()) {
    const inRail = desktop.locator(`a[href="${href}"]`);
    if ((await inRail.count()) > 0) {
      if (present) await expect(inRail.first()).toBeVisible();
      else await expect(inRail).toHaveCount(0);
      return;
    }
    const moreBtn = desktop.getByRole("button", { name: /^mais$/i });
    if (await moreBtn.isVisible().catch(() => false)) {
      const menu = page.getByRole("menu", { name: /mais módulos/i });
      if (!(await menu.isVisible().catch(() => false))) {
        await moreBtn.click();
      }
      const inMore = menu.locator(`a[href="${href}"]`);
      if (present) await expect(inMore).toBeVisible();
      else await expect(inMore).toHaveCount(0);
      return;
    }
    if (present) {
      await expect(inRail).toBeVisible();
    } else {
      await expect(inRail).toHaveCount(0);
    }
    return;
  }

  const drawer = internoNavDrawer(page);
  const inDrawer = drawer.locator(`a[href="${href}"]`);
  if (present) await expect(inDrawer).toBeVisible();
  else await expect(inDrawer).toHaveCount(0);
}

/** Conteúdo principal de uma página de portal (evita texto oculto no header/nav). */
export function portalMain(page: Page) {
  return page.locator(".portal-page-content");
}
