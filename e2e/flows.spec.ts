import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Proteção de rotas (proxy)", () => {
  test("interno sem sessão redireciona para login", async ({ page }) => {
    await page.goto("/interno/dashboard");
    await expect(page).toHaveURL(/\/interno\/login/);
  });

  test("PJ sem sessão redireciona para login", async ({ page }) => {
    await page.goto("/pj");
    await expect(page).toHaveURL(/\/pj\/login/);
  });

  test("beneficiário sem sessão redireciona para login", async ({ page }) => {
    await page.goto("/beneficiario");
    await expect(page).toHaveURL(/\/beneficiario\/login/);
  });

  test("prestador sem sessão redireciona para login", async ({ page }) => {
    await page.goto("/prestador");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Portal PJ — fluxo corporativo", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "pj", "rh@techcorp.com");
  });

  test("painel carrega KPIs da TechCorp", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /TechCorp/i })).toBeVisible();
    await expect(page.getByText(/MRR estimado/i)).toBeVisible();
    await expect(page.getByText(/Contrato/i).first()).toBeVisible();
  });

  test("seções de beneficiários, assinaturas e faturas", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Beneficiários" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Assinaturas recorrentes" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Faturas da empresa" })).toBeVisible();
  });

  test("botão exportar relatório CSV presente", async ({ page }) => {
    await expect(page.getByRole("button", { name: /exportar relatório csv/i })).toBeVisible();
  });
});

test.describe("Portal Beneficiário — self-service", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "beneficiario", "joao.pereira@email.com");
  });

  test("saudação personalizada e resumo", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Olá,/i })).toBeVisible();
    await expect(page.getByText(/consumo|pendente|fatura/i).first()).toBeVisible();
  });

  test("formulário de agendamento visível", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Agendar consulta" })).toBeVisible();
  });

  test("seções de agenda, consumo e faturas", async ({ page }) => {
    await expect(page.getByText(/agenda|atendimento/i).first()).toBeVisible();
    await expect(page.getByText(/pay per use|consumo/i).first()).toBeVisible();
  });
});

test.describe("Portal Prestador — agenda e atendimento", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "prestador", "dra.helena@bibi.health");
  });

  test("agenda do dia carrega", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /agenda de hoje/i })).toBeVisible();
  });

  test("abre tela de atendimento quando há consulta", async ({ page }) => {
    const link = page.getByRole("link").filter({ hasText: /atendimento|consulta|\d{2}:\d{2}/i }).first();
    if (await link.isVisible()) {
      await link.click();
      await expect(page).toHaveURL(/\/prestador\/atendimento\//);
      await expect(page.getByText(/procedimento|prontuário|pep/i).first()).toBeVisible();
    }
  });
});

test.describe("Logout", () => {
  test("encerra sessão e bloqueia área autenticada", async ({ page }) => {
    await loginAs(page, "interno", "faturamento@bibi.health");
    await page.getByRole("button", { name: /sair/i }).click();
    await expect(page).toHaveURL(/\/interno\/login/);
    await page.goto("/interno/dashboard");
    await expect(page).toHaveURL(/\/interno\/login/);
  });
});
