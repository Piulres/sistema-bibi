import { test, expect } from "@playwright/test";
import { loginAs, internoNav, internoNavDrawer } from "./helpers/auth";

test.describe("landing mobile menu", () => {
  test("home: drawer exibe links de navegação em tela cheia", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await page.getByRole("button", { name: /abrir menu/i }).click();
    const drawer = page.getByRole("dialog", { name: /menu de navegação/i });
    await expect(drawer).toBeVisible();

    const box = await drawer.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThan(300);

    await expect(drawer.getByRole("navigation", { name: /seções da landing/i })).toBeVisible();
    await expect(drawer.getByRole("link", { name: /entrar/i })).toBeVisible();
    await expect(drawer.getByRole("link", { name: /acessar portais/i })).toBeVisible();
  });
});

test.describe("navegação responsiva", () => {
  test("interno: drawer mobile lista White Label", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAs(page, "interno", "faturamento@bibi.health");

    await expect(page.getByRole("button", { name: /dashboard/i })).toBeVisible();
    await expect(internoNav(page)).toHaveCount(0);

    await page.getByRole("button", { name: /dashboard/i }).click();
    const drawer = internoNavDrawer(page);
    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: "White Label" }).click();

    await expect(page).toHaveURL(/\/interno\/branding/);
    await expect(page.getByRole("heading", { name: "White Label", exact: true })).toBeVisible();
  });

  test("interno: abas desktop com faixa rolável", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "interno", "faturamento@bibi.health");

    const tabs = internoNav(page);
    await expect(tabs).toBeVisible();
    await tabs.getByRole("link", { name: "White Label" }).click();
    await expect(page).toHaveURL(/\/interno\/branding/);
  });

  test("beneficiário: drawer mobile para módulos", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAs(page, "beneficiario", "joao.pereira@email.com");

    await expect(page.getByRole("button", { name: /resumo/i })).toBeVisible();
    await page.getByRole("button", { name: /resumo/i }).click();
    const drawer = page.getByRole("navigation", { name: "Módulos do portal" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: "Faturas" }).click();
    await expect(page).toHaveURL(/\/beneficiario\/faturas/);
  });

  test("pj: drawer mobile para seções", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAs(page, "pj", "rh@techcorp.com");
    await expect(page.locator("#faturas")).toBeAttached();

    const sectionTrigger = page.locator('[aria-controls="mobile-section-drawer"]');
    await expect(sectionTrigger).toBeVisible();
    await sectionTrigger.click();
    const drawer = page.getByRole("dialog", { name: "Seções da empresa" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("button", { name: "Faturas" }).click();
    await expect(page).toHaveURL(/#faturas/, { timeout: 10000 });
  });

  test("prestador: drawer mobile com Início e Agenda", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAs(page, "prestador", "dra.helena@bibi.health");

    await expect(page.getByRole("button", { name: /início/i })).toBeVisible();
    await page.getByRole("button", { name: /início/i }).click();
    const drawer = page.getByRole("navigation", { name: "Módulos do prestador" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: "Agenda" }).click();
    await expect(page).toHaveURL(/\/prestador$/);
  });
});
