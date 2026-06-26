import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Melhorias de fluxo — mapa interno", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "interno", "recepcao@bibi.health");
  });

  test("mapa de melhorias de fluxo visível em cadastros", async ({ page }) => {
    await page.goto("/interno/cadastros?tab=operations");
    await expect(page.getByRole("heading", { name: /Mapa de melhorias de fluxo/i })).toBeVisible();
    await expect(page.getByText(/Cancelar consulta agendada/i)).toBeVisible();
    await expect(page.getByText(/Confirmar presença do paciente/i)).toBeVisible();
  });
});

test.describe("Portal Prestador — confirmar presença", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "prestador", "dra.helena@bibi.health");
  });

  test("botão Paciente presente na tela de atendimento", async ({ page }) => {
    await page.goto("/prestador");
    await expect(page.getByRole("heading", { name: /Agenda de hoje/i })).toBeVisible();

    const agendadoCard = page.locator("li").filter({ hasText: "AGENDADO" }).first();
    await expect(agendadoCard).toBeVisible({ timeout: 15_000 });

    const link = agendadoCard.getByRole("link", { name: /Abrir atendimento/i });
    await link.click();
    await expect(page).toHaveURL(/\/prestador\/atendimento\//);

    const presentBtn = page.getByRole("button", { name: /Paciente presente/i });
    await expect(presentBtn).toBeVisible();
    await presentBtn.scrollIntoViewIfNeeded();
    await presentBtn.click({ force: true });
    await expect(page.getByText(/presença do paciente confirmada/i)).toBeVisible();
  });
});

test.describe("Portal Beneficiário — agenda com cards", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "beneficiario", "joao.pereira@email.com");
  });

  test("seção Minha agenda com cards", async ({ page }) => {
    await page.goto("/beneficiario/agenda");
    await expect(page.getByRole("heading", { name: /Minha agenda/i })).toBeVisible();
  });
});
