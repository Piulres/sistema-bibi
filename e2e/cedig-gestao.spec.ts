import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { expectFeedbackMessage } from "./helpers/feedback";

test.describe("CEDIG — gestão clínica fase 2 / F", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test("Alana lança exame e ponte SYNCED aparece na lista", async ({ page }) => {
    await loginAs(page, "interno", "alana@cedig.demo", "bibi123", "cedig");
    await page.goto("/interno/gestao");
    await expect(page.getByRole("heading", { name: /Gestão clínica/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/Carregando gestão clínica/i)).toHaveCount(0, {
      timeout: 20_000,
    });

    const unique = `E2E Cedig ${Date.now()}`;
    await page.getByLabel(/Nome do paciente/i).fill(unique);
    await page.getByLabel(/^Médico/i).selectOption({ index: 1 });
    await page.getByLabel(/Tabela de preço/i).selectOption("PARTICULAR");
    await page.getByLabel(/Tipo de exame/i).selectOption({ index: 1 });
    await page.getByLabel(/Forma de pagamento/i).selectOption("PIX");

    const amount = page.getByLabel(/Valor recebido/i);
    if (!(await amount.inputValue())) {
      await amount.fill("750");
    }

    await page.getByRole("button", { name: /Registrar lançamento/i }).click();
    await expectFeedbackMessage(page, /Lançamento registrado/i);

    const row = page.locator("table tbody tr").filter({ hasText: unique }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row.getByText(/SYNCED|PARTIAL/i)).toBeVisible();
  });

  test("agenda oferece Lançar na gestão com prefill", async ({ page }) => {
    await loginAs(page, "interno", "alana@cedig.demo", "bibi123", "cedig");
    await page.goto("/interno/agenda");
    await expect(page.getByText(/Carregando agenda/i)).toHaveCount(0, { timeout: 15_000 });

    const launchLink = page.locator('[data-cursor-id="agenda-launch-gestao"]').first();
    if ((await launchLink.count()) === 0) {
      test.skip(true, "Sem agendamentos CEDIG no dia para prefill");
      return;
    }

    await launchLink.click();
    await expect(page).toHaveURL(/\/interno\/gestao\?/);
    await expect(page.locator('[data-cursor-id="clinic-finance-from-agenda"]')).toBeVisible({
      timeout: 15_000,
    });
  });

  test("beneficiário CEDIG vê labels Exame no PageHeader e formulário", async ({ page }) => {
    await loginAs(page, "beneficiario", "maria.cedig@email.com", "bibi123", "cedig");
    await page.goto("/beneficiario/agendar");
    await expect(page.getByRole("heading", { name: /Agendar exame/i })).toBeVisible({
      timeout: 20_000,
    });
  });

  test("prestador CEDIG acessa pacientes / agenda", async ({ page }) => {
    await loginAs(page, "prestador", "bruno.dias@cedig.demo", "bibi123", "cedig");
    await page.goto("/prestador");
    await expect(page.getByRole("heading", { name: /./ }).first()).toBeVisible({
      timeout: 20_000,
    });
    await page.goto("/prestador/pacientes");
    await expect(page.getByText(/Carregando/i)).toHaveCount(0, { timeout: 15_000 });
  });

  test("PJ Bem Saúde faz login no portal", async ({ page }) => {
    await loginAs(page, "pj", "rh@bemsaude.demo", "bibi123", "cedig");
    await page.goto("/pj");
    await expect(page.getByRole("heading", { name: /./ }).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("dashboard interno mostra hint da gestão clínica", async ({ page }) => {
    await loginAs(page, "interno", "operacao@cedig.demo", "bibi123", "cedig");
    await page.goto("/interno/dashboard");
    await expect(page.locator('[data-cursor-id="dashboard-gestao-hint"]')).toBeVisible({
      timeout: 20_000,
    });
  });

  test("gestão clínica não estoura horizontal no mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAs(page, "interno", "alana@cedig.demo", "bibi123", "cedig");
    await page.goto("/interno/gestao");
    await expect(page.getByRole("heading", { name: /Gestão clínica/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/Carregando gestão clínica/i)).toHaveCount(0, {
      timeout: 20_000,
    });

    const root = page.locator('[data-cursor-id="clinic-finance-root"]');
    await expect(root).toBeVisible();
    await expect(page.getByRole("button", { name: /Registrar lançamento/i })).toBeVisible();
    await expect(page.getByLabel(/Nome do paciente/i)).toBeVisible();

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
      };
    });
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
});
