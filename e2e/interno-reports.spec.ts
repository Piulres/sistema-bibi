import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("portal interno — relatórios", () => {
  test("faturamento: página de relatórios carrega exportações", async ({ page }) => {
    await loginAs(page, "interno", "financeiro@bibi.health");
    await page.goto("/interno/relatorios");
    await expect(page.getByRole("heading", { name: "Relatórios", exact: true })).toBeVisible();
    await expect(page.getByText("Faturamento e Pay Per Use")).toBeVisible();
    await expect(page.getByRole("button", { name: "PDF" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Excel" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "CSV" }).first()).toBeVisible();
  });
});
