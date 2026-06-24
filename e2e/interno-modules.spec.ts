import { expect, test } from "@playwright/test";
import { loginAs, openInternoNav, portalMain } from "./helpers/auth";
import { MEDICAL_INTERNO_NAV } from "./helpers/labels";

const ADMIN_MODULES: { path: string; heading: RegExp | string }[] = [
  { path: "/interno/dashboard", heading: /Dashboard Executivo/i },
  { path: "/interno", heading: /Faturamento/i },
  { path: "/interno/agenda", heading: /^Agenda$/ },
  { path: "/interno/cadastros", heading: /Cadastros/i },
  { path: "/interno/estoque", heading: /Estoque Médico/i },
  { path: "/interno/crm", heading: /CRM Corporativo/i },
  { path: "/interno/assinaturas", heading: /Recorrência/i },
  { path: "/interno/comunicacao", heading: /Comunicação/i },
  { path: "/interno/relatorios", heading: /^Relatórios$/ },
  { path: "/interno/auditoria", heading: /^Auditoria$/ },
  { path: "/interno/branding", heading: /White Label/i },
  { path: "/interno/integracoes", heading: /Integrações B2B/i },
  { path: "/interno/seguranca", heading: /Segurança/i },
];

test.describe("Portal Interno — módulos (ADMIN)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "interno", "faturamento@bibi.health");
  });

  for (const mod of ADMIN_MODULES) {
    test(`carrega ${mod.path}`, async ({ page }) => {
      await page.goto(mod.path);
      await expect(
        page.getByRole("heading", { level: 1, name: mod.heading }),
      ).toBeVisible();
    });
  }

  test("nav exibe todos os módulos para admin", async ({ page }) => {
    await page.goto("/interno/dashboard");
    const nav = await openInternoNav(page);
    for (const label of [
      "Dashboard",
      "Faturamento",
      MEDICAL_INTERNO_NAV.appointments,
      MEDICAL_INTERNO_NAV.cadastros,
      MEDICAL_INTERNO_NAV.estoque,
      "CRM Corporativo",
      "Recorrência",
      "Comunicação",
      "Relatórios",
      "Auditoria",
      "White Label",
      "Integrações",
      "Segurança",
    ]) {
      await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
  });

  test("faturamento exibe pendências ou faturas emitidas", async ({ page }) => {
    await page.goto("/interno");
    await expect(page.getByRole("heading", { name: "Faturamento", level: 1 })).toBeVisible();
    await expect(
      portalMain(page).getByText(/procedimentos a faturar|faturas emitidas|nenhum procedimento pendente/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("dashboard exibe bloco de receita", async ({ page }) => {
    await page.goto("/interno/dashboard");
    await expect(page.getByRole("heading", { name: /Receita/i })).toBeVisible();
  });
});
