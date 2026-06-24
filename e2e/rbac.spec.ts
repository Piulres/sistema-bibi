import { expect, test } from "@playwright/test";
import { loginAs, internoNavLink, openInternoNav } from "./helpers/auth";

test.describe("RBAC — perfil RECEPCAO", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "interno", "recepcao@bibi.health");
  });

  test("nav limitada: agenda e cadastros, sem faturamento", async ({ page }) => {
    await page.goto("/interno/dashboard");
    const nav = await openInternoNav(page);
    await expect(internoNavLink(page, "/interno/agenda")).toBeVisible();
    await expect(internoNavLink(page, "/interno/cadastros")).toBeVisible();
    await expect(internoNavLink(page, "/interno/comunicacao")).toBeVisible();
    await expect(internoNavLink(page, "/interno")).toHaveCount(0);
    await expect(internoNavLink(page, "/interno/integracoes")).toHaveCount(0);
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
    const nav = await openInternoNav(page);
    await expect(internoNavLink(page, "/interno")).toBeVisible();
    await expect(internoNavLink(page, "/interno/assinaturas")).toBeVisible();
    await expect(internoNavLink(page, "/interno/relatorios")).toBeVisible();
    await expect(internoNavLink(page, "/interno/cadastros")).toHaveCount(0);
    await expect(internoNavLink(page, "/interno/seguranca")).toHaveCount(0);
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
