import { expect, test } from "@playwright/test";
import { loginAs, expectInternoNavHref } from "./helpers/auth";

test.describe("RBAC — perfil RECEPCAO", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "interno", "recepcao@bibi.health");
  });

  test("nav limitada: agenda e cadastros, sem faturamento", async ({ page }) => {
    await page.goto("/interno/dashboard");
    await expectInternoNavHref(page, "/interno/agenda", true);
    await expectInternoNavHref(page, "/interno/cadastros", true);
    await expectInternoNavHref(page, "/interno/comunicacao", true);
    await expectInternoNavHref(page, "/interno", false);
    await expectInternoNavHref(page, "/interno/integracoes", false);
  });

  test("acesso direto a faturamento redireciona para dashboard", async ({ page }) => {
    await page.goto("/interno");
    await expect(page).toHaveURL(/\/interno\/dashboard/);
  });

  test("acessa agenda normalmente", async ({ page }) => {
    await page.goto("/interno/agenda");
    await expect(page.getByRole("heading", { name: /^Agenda$/ })).toBeVisible();
  });
});

test.describe("RBAC — perfil FATURAMENTO", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "interno", "financeiro@bibi.health");
  });

  test("nav limitada: faturamento e recorrência, sem cadastros", async ({ page }) => {
    await page.goto("/interno/dashboard");
    await expectInternoNavHref(page, "/interno", true);
    await expectInternoNavHref(page, "/interno/assinaturas", true);
    await expectInternoNavHref(page, "/interno/relatorios", true);
    await expectInternoNavHref(page, "/interno/cadastros", false);
    await expectInternoNavHref(page, "/interno/seguranca", false);
  });

  test("acesso direto a cadastros redireciona para dashboard", async ({ page }) => {
    await page.goto("/interno/cadastros");
    await expect(page).toHaveURL(/\/interno\/dashboard/);
  });

  test("acessa faturamento normalmente", async ({ page }) => {
    await page.goto("/interno");
    await expect(page.getByRole("heading", { name: /Faturamento/i })).toBeVisible();
  });
});

test.describe("RBAC — portal errado", () => {
  test("prestador não loga no portal interno", async ({ page }) => {
    await page.goto("/interno/login");
    await page.getByLabel(/e-mail/i).fill("dra.helena@bibi.health");
    await page.getByLabel(/senha/i).fill("bibi123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page.getByText(/não tem acesso/i)).toBeVisible();
  });
});
