import { expect, test } from "@playwright/test";

test.describe("Swagger UI — documentação da API", () => {
  test("URL canônica /api/docs carrega a interface", async ({ page }) => {
    await page.goto("/api/docs");
    await expect(page).toHaveTitle(/API|Sistema Bibi|ServiceOS/i);
    await expect(page.getByRole("heading", { name: /documentação da api/i })).toBeVisible();
    await expect(page.locator("#swagger-ui")).toBeVisible();
  });

  test("spec OpenAPI está acessível em YAML", async ({ request }) => {
    const res = await request.get("/openapi.yaml");
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain("openapi: 3.");
    expect(body).toContain("/api/auth/login");
  });

  test("assets self-hosted do Swagger respondem 200", async ({ request }) => {
    for (const asset of ["/swagger-ui/swagger-ui.css", "/swagger-ui/swagger-ui-bundle.js"]) {
      const res = await request.get(asset);
      expect(res.ok(), asset).toBeTruthy();
    }
  });

  test("legado /api-docs.html redireciona para /api/docs", async ({ page }) => {
    await page.goto("/api-docs.html");
    await expect(page).toHaveURL(/\/api\/docs$/);
  });
});
