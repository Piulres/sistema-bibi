import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

const ADMIN_MODULES: { path: string; heading: RegExp | string }[] = [
  { path: "/interno/dashboard", heading: /Dashboard Executivo/i },
  { path: "/interno", heading: /Faturamento/i },
  { path: "/interno/agenda", heading: /^Agenda$/ },
  { path: "/interno/cadastros", heading: /Cadastros/i },
  { path: "/interno/crm", heading: /CRM Corporativo/i },
  { path: "/interno/assinaturas", heading: /Recorrência/i },
  { path: "/interno/comunicacao", heading: /Comunicação/i },
  { path: "/interno/relatorios", heading: "Relatórios" },
  { path: "/interno/branding", heading: /White Label/i },
  { path: "/interno/integracoes", heading: /Integrações B2B/i },
  { path: "/interno/seguranca", heading: /Segurança/i },
];

test.describe("Portal Interno — módulos (ADMIN)", () => {
  test.beforeEach(async ({ page }) => {
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
    const nav = page.getByRole("navigation", { name: "Navegação por abas" });
    for (const label of [
      "Dashboard",
      "Faturamento",
      "Agenda",
      "Cadastros",
      "CRM Corporativo",
      "Recorrência",
      "Comunicação",
      "Relatórios",
      "White Label",
      "Integrações",
      "Segurança",
    ]) {
      await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
  });

  test("faturamento exibe pendências ou faturas emitidas", async ({ page }) => {
    await page.goto("/interno");
    await expect(
      page.getByText(/pendente|fatura|pay per use|procedimento/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("dashboard exibe bloco de receita", async ({ page }) => {
    await page.goto("/interno/dashboard");
    await expect(page.getByRole("heading", { name: /Receita/i })).toBeVisible();
  });
});
