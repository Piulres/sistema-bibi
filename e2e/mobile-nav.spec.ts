import { test, expect } from "@playwright/test";
import { loginAs, internoNav, internoNavDrawer } from "./helpers/auth";

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

  test("beneficiário: drawer mobile para seções", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAs(page, "beneficiario", "joao.pereira@email.com");

    await expect(page.getByRole("button", { name: /agendar/i })).toBeVisible();
    await page.getByRole("button", { name: /agendar/i }).click();
    const drawer = page.getByRole("navigation", { name: "Seções do beneficiário" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("button", { name: "Faturas" }).click();
    await expect(page).toHaveURL(/#faturas/);
  });
});
