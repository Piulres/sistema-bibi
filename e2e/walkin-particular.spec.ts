import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Portal Interno — walk-in particular", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "interno", "recepcao@bibi.health");
  });

  test("formulário walk-in e mapa CRUD visíveis", async ({ page }) => {
    await page.goto("/interno/agenda");
    await expect(
      page.getByRole("heading", { name: /Paciente particular \(walk-in\)/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Cadastrar e agendar agora/i }),
    ).toBeVisible();

    await page.goto("/interno/cadastros?tab=operations");
    await expect(page.getByRole("heading", { name: /Mapa de operações CRUD/i })).toBeVisible();
    await expect(page.getByText(/Beneficiário \/ paciente/i)).toBeVisible();
  });

  test("cadastra walk-in particular e confirma chegada", async ({ page }) => {
    const unique = Date.now();
    const cpf = `${String(unique).slice(-11).padStart(11, "0")}`;

    await page.goto("/interno/agenda");
    await page.locator("#walkin-name").fill(`Walk-in Teste ${unique}`);
    await page.locator("#walkin-cpf").fill(cpf);
    await page.locator("#walkin-birth").fill("1990-05-15");
    await page.locator("#walkin-provider").selectOption({ index: 1 });

    await page.getByRole("button", { name: /Cadastrar e agendar agora/i }).click();
    await expect(page.getByText(/Walk-in:.*cadastrado/i)).toBeVisible({ timeout: 15_000 });

    const card = page
      .locator(".ds-card")
      .filter({ hasText: `Walk-in Teste ${unique}` })
      .filter({ hasText: /·/ });
    await card.getByRole("button", { name: /Confirmar chegada/i }).click();
    await expect(page.getByText(/Chegada confirmada/i)).toBeVisible();
  });
});
