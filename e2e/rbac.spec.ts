import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("RBAC — perfil RECEPCAO", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "interno", "recepcao@bibi.health");
  });

  test("nav limitada: agenda e cadastros, sem faturamento", async ({ page }) => {
    await page.goto("/interno/dashboard");
    await expect(page.getByRole("link", { name: "Agenda" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Cadastros" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Comunicação" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Faturamento" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Integrações" })).toHaveCount(0);
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
    await loginAs(page, "interno", "financeiro@bibi.health");
  });

  test("nav limitada: faturamento e recorrência, sem cadastros", async ({ page }) => {
    await page.goto("/interno/dashboard");
    await expect(page.getByRole("link", { name: "Faturamento" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Recorrência" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Relatórios" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Cadastros" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Segurança" })).toHaveCount(0);
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
