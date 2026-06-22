import { expect, test } from "@playwright/test";

test.describe("Smoke — portais e autenticação", () => {
  test("landing pública carrega", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Bibi|Sistema/i);
  });

  test("login prestador redireciona para dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/e-mail/i).fill("dra.helena@bibi.health");
    await page.getByLabel(/senha/i).fill("bibi123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/prestador/);
  });

  test("login interno (faturamento) acessa dashboard", async ({ page }) => {
    await page.goto("/interno/login");
    await page.getByLabel(/e-mail/i).fill("faturamento@bibi.health");
    await page.getByLabel(/senha/i).fill("bibi123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/interno\/dashboard/);
  });

  test("credencial errada mostra erro", async ({ page }) => {
    await page.goto("/interno/login");
    await page.getByLabel(/e-mail/i).fill("faturamento@bibi.health");
    await page.getByLabel(/senha/i).fill("senha-errada");
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page.getByText(/incorretos|inválid/i)).toBeVisible();
  });
});

test.describe("Pay Per Use — fluxo crítico de receita", () => {
  test("prestador vê agenda do dia", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/e-mail/i).fill("dra.helena@bibi.health");
    await page.getByLabel(/senha/i).fill("bibi123");
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/prestador/);
    await page.goto("/prestador");
    await expect(page.getByRole("heading", { name: /agenda de hoje/i })).toBeVisible();
  });
});
