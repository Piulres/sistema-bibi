import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

const DEMO_JOAO = "joao.pereira@email.com";

test.describe("Assistente — chat nos portais", () => {
  test("interno: abre painel e consulta agenda do dia", async ({ page }) => {
    await loginAs(page, "interno", "recepcao@bibi.health");
    await page.goto("/interno/dashboard");

    await page.getByRole("button", { name: /abrir assistente/i }).click();
    await expect(page.getByRole("dialog", { name: /assistente/i })).toBeVisible();
    await expect(page.getByText(/assistente operacional/i)).toBeVisible();

    const input = page.getByPlaceholder(/pergunte ou peça uma ação/i);
    await input.fill("Quantos agendamentos temos hoje?");
    await input.press("Enter");

    await expect(page.getByRole("dialog")).toContainText(/agendamento|consulta|hoje/i, {
      timeout: 15_000,
    });
  });

  test("prestador: consulta agenda pelo assistente", async ({ page }) => {
    await loginAs(page, "prestador", "dra.helena@bibi.health");
    await page.goto("/prestador");

    await page.getByRole("button", { name: /abrir assistente/i }).click();
    await expect(page.getByRole("dialog", { name: /assistente/i })).toBeVisible();

    await page.getByRole("button", { name: /minha agenda de hoje/i }).click();

    await expect(page.getByRole("dialog")).toContainText(/agenda|agendamento|hoje/i, {
      timeout: 15_000,
    });
  });

  test("prestador: link de ação fecha o assistente no mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAs(page, "prestador", "dra.helena@bibi.health");
    await page.goto("/prestador");

    await page.getByRole("button", { name: /abrir assistente/i }).click();
    const dialog = page.getByRole("dialog", { name: /assistente/i });
    await expect(dialog).toBeVisible();

    await page.getByRole("button", { name: /minha agenda de hoje/i }).click();
    const actionLink = dialog.getByRole("link").filter({ hasText: /ver agenda|agenda/i }).first();
    await expect(actionLink).toBeVisible({ timeout: 15_000 });
    await actionLink.click();

    await expect(dialog).toBeHidden({ timeout: 5_000 });
  });

  test("beneficiário: chip de resumo retorna saudação", async ({ page }) => {
    await loginAs(page, "beneficiario", DEMO_JOAO);
    await page.goto("/beneficiario/resumo");

    await page.getByRole("button", { name: /abrir assistente/i }).click();
    await page.getByRole("button", { name: /^meu resumo$/i }).click();

    await expect(page.getByRole("dialog")).toContainText(/olá|fatura|agendamento|resumo/i, {
      timeout: 15_000,
    });
  });

  test("VET PetCare: consulta agenda com vocabulário do nicho", async ({ page }) => {
    await loginAs(page, "interno", "operacao@petcare.demo", "bibi123", "petcare");
    await page.goto("/interno/agenda?tenant=petcare");

    await page.getByRole("button", { name: /abrir assistente/i }).click();
    await expect(page.getByRole("dialog", { name: /assistente/i })).toBeVisible();

    const input = page.getByPlaceholder(/pergunte ou peça uma ação/i);
    await input.fill("Quantos atendimentos temos hoje?");
    await input.press("Enter");

    await expect(page.getByRole("dialog")).toContainText(/atendimento|agendamento|hoje|pet/i, {
      timeout: 15_000,
    });
  });
});
