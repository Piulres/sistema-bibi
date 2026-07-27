import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * Smoke UI das fases de estoque (1–4): login API + abas Resumo/Produtos/Lotes/Movimentos.
 * Usa cookie de sessão (mesmo padrão de e2e/smoke) para evitar flakiness do formulário.
 */

const RECEPCAO = {
  email: "recepcao@bibi.health",
  password: "bibi123",
  portal: "interno",
  tenantSlug: "horizonte",
};

async function loginInternoViaApi(request: APIRequestContext) {
  const res = await request.post("/api/auth/login", { data: RECEPCAO });
  expect(res.ok(), `login API ${res.status()}: ${await res.text()}`).toBeTruthy();
}

async function openEstoque(page: Page) {
  await page.goto("/interno/estoque");
  await expect(page).toHaveURL(/\/interno\/estoque/);
  await expect(page.getByRole("heading", { name: /Estoque/ })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole("tablist", { name: "Abas do estoque médico" })).toBeVisible();
}

test.describe("Estoque fases 1–4 — smoke UI após login API (valida abas e ações críticas na tela)", () => {
  test.beforeEach(async ({ page }) => {
    await loginInternoViaApi(page.request);
  });

  test("Resumo e Produtos: lista produtos e cria produto com lote (Fase 2/3)", async ({
    page,
  }) => {
    await openEstoque(page);

    await page.getByRole("tab", { name: "Resumo" }).click();
    await expect(page.getByText("Alertas operacionais")).toBeVisible();
    await expect(page.getByText("Produtos ativos")).toBeVisible();

    await page.getByRole("tab", { name: "Produtos" }).click();
    await expect(page.getByText("Catálogo de produtos")).toBeVisible();
    await expect(page.getByText("Novo produto")).toBeVisible();

    const suffix = Date.now().toString(36);
    const name = `Kit Curativo Smoke ${suffix}`;
    await page.getByLabel("SKU", { exact: true }).fill(`SKU-SMK-${suffix}`);
    await page.getByLabel("Nome", { exact: true }).fill(name);
    await page.getByRole("button", { name: "Cadastrar" }).click();

    // Desktop: tabela (md:block); mobile: lista md:hidden — exige o item visível.
    await expect(page.getByText(name).locator("visible=true").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("Lotes: entrada de estoque e status do lote (Fase 2)", async ({ page }) => {
    await openEstoque(page);
    await page.getByRole("tab", { name: "Lotes" }).click();
    await expect(page.getByRole("heading", { name: "Entrada de estoque" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Registrar entrada" })).toBeVisible();

    const statusBadge = page.getByText(
      /Disponível|Quarentena|Bloqueado|Esgotado|Vencido/,
    );
    if ((await statusBadge.count()) > 0) {
      await expect(statusBadge.first()).toBeVisible();
    }
  });

  test("Movimentos: tipos manuais restritos e botão Reverter (Fase 1/4)", async ({
    page,
  }) => {
    await openEstoque(page);
    await page.getByRole("tab", { name: "Movimentos" }).click();
    await expect(page.getByText("Nova movimentação")).toBeVisible();
    await expect(page.getByRole("button", { name: "Registrar" })).toBeVisible();

    const tipo = page.locator("label", { hasText: "Tipo" }).locator("select");
    await expect(tipo).toBeVisible();
    const options = await tipo.locator("option").allTextContents();
    const normalized = options.map((o) => o.trim());
    expect(normalized).toEqual([
      "Saída",
      "Ajuste de inventário (baixa)",
      "Perda / avaria",
    ]);
    expect(normalized.join(" ")).not.toMatch(/Entrada|Dispensa|Transfer/i);

    const reverter = page.getByRole("button", { name: "Reverter" });
    if ((await reverter.count()) > 0) {
      await expect(reverter.first()).toBeEnabled();
    }
  });
});
