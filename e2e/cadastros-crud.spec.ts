import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

const suffix = () => Date.now().toString().slice(-6);

function generateValidCpf(): string {
  const base = String(Date.now() % 1000000000)
    .padStart(9, "0")
    .slice(-9)
    .split("")
    .map(Number);
  const w1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  const mod = (nums: number[], weights: number[]) => {
    const sum = nums.reduce((acc, d, i) => acc + d * weights[i], 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = mod(base, w1);
  const d2 = mod([...base, d1], w2);
  return [...base, d1, d2].join("");
}

function generateValidCnpj(): string {
  const base = String(Date.now() % 100000000000)
    .padStart(12, "0")
    .slice(-12)
    .split("")
    .map(Number);
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const mod = (nums: number[], weights: number[]) => {
    const sum = nums.reduce((acc, d, i) => acc + d * weights[i], 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = mod(base, w1);
  const d2 = mod([...base, d1], w2);
  return [...base, d1, d2].join("");
}

/** Item na listagem (modo leitura — texto visível no DOM). */
function listItemByText(page: import("@playwright/test").Page, text: string) {
  return page.getByRole("listitem").filter({ hasText: text });
}

/** Linha em edição inline (única com botão Salvar na listagem). */
function editingListItem(page: import("@playwright/test").Page) {
  return page.getByRole("listitem").filter({ has: page.getByRole("button", { name: "Salvar" }) });
}

test.describe("Cadastros — existência das abas CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "interno", "faturamento@bibi.health");
    await page.goto("/interno/cadastros");
  });

  test("exibe abas Beneficiários, Empresas, Procedimentos e Usuários", async ({ page }) => {
    const tabs = page.getByRole("navigation", { name: "Abas da página" });
    await expect(tabs.getByRole("button", { name: "Beneficiários" })).toBeVisible();
    await expect(tabs.getByRole("button", { name: "Empresas" })).toBeVisible();
    await expect(tabs.getByRole("button", { name: "Procedimentos" })).toBeVisible();
    await expect(tabs.getByRole("button", { name: "Usuários" })).toBeVisible();
  });

  for (const tab of ["Empresas", "Procedimentos", "Usuários"] as const) {
    test(`aba ${tab} carrega listagem sem erro`, async ({ page }) => {
      await page.getByRole("navigation", { name: "Abas da página" }).getByRole("button", { name: tab }).click();
      await expect(page.getByText(/Sem permissão|Falha ao carregar/i)).toHaveCount(0);
      await expect(
        page
          .getByRole("button", { name: "Cadastrar" })
          .or(page.getByRole("button", { name: "Criar usuário" })),
      ).toBeVisible();
    });
  }
});

test.describe("Cadastros — execução CRUD (ADMIN)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "interno", "faturamento@bibi.health");
    await page.goto("/interno/cadastros");
    await expect(page.getByText(/Carregando cadastros/i)).toHaveCount(0, { timeout: 15_000 });
  });

  test("CREATE + READ beneficiário", async ({ page }) => {
    const name = `E2E Benef ${suffix()}`;
    const card = page.locator("section, div").filter({ has: page.getByRole("heading", { name: "Novo beneficiário" }) }).first();
    const form = card.locator("form");
    await form.locator("label").filter({ hasText: /^Nome$/ }).locator("input").fill(name);
    await form.locator("label").filter({ hasText: /^CPF$/ }).locator("input").fill(generateValidCpf());
    await form.locator('input[type="date"]').fill("1990-01-15");
    await form.getByRole("button", { name: "Cadastrar" }).click();
    await expect(page.getByText(new RegExp(`Beneficiário ${name} cadastrado`))).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("link", { name })).toBeVisible();
  });

  test("CREATE + UPDATE empresa", async ({ page }) => {
    await page.getByRole("navigation", { name: "Abas da página" }).getByRole("button", { name: "Empresas" }).click();
    const name = `E2E Empresa ${suffix()} LTDA`;
    const card = page.locator("section, div").filter({ has: page.getByRole("heading", { name: "Nova empresa" }) }).first();
    const form = card.locator("form");
    await form.locator("label").filter({ hasText: /Razão social/ }).locator("input").fill(name);
    await form.locator("label").filter({ hasText: /^CNPJ$/ }).locator("input").fill(generateValidCnpj());
    await form.getByRole("button", { name: "Cadastrar" }).click();
    await expect(page.getByText(new RegExp(`Empresa ${name} cadastrada`))).toBeVisible({
      timeout: 10_000,
    });

    const row = listItemByText(page, name);
    await row.scrollIntoViewIfNeeded();
    await row.getByRole("button", { name: "Editar" }).click();
    const editRow = editingListItem(page);
    await expect(editRow).toBeVisible();
    await editRow.getByRole("textbox").first().fill(`${name} (editada)`);
    await editRow.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText(/Empresa .* atualizada/)).toBeVisible({ timeout: 10_000 });
    await expect(listItemByText(page, `${name} (editada)`)).toBeVisible();
  });

  test("CREATE + UPDATE + DELETE procedimento", async ({ page }) => {
    await page.getByRole("navigation", { name: "Abas da página" }).getByRole("button", { name: "Procedimentos" }).click();
    const code = `E2E${suffix()}`;
    const card = page.locator("section, div").filter({ has: page.getByRole("heading", { name: "Novo procedimento" }) }).first();
    const form = card.locator("form");
    await form.locator("label").filter({ hasText: /^Código$/ }).locator("input").fill(code);
    await form.locator("label").filter({ hasText: /^Nome$/ }).locator("input").fill("Procedimento E2E");
    await form.locator("label").filter({ hasText: /Preço/ }).locator("input").fill("199");
    await form.getByRole("button", { name: "Cadastrar" }).click();
    await expect(page.getByText(new RegExp(`Procedimento ${code} cadastrado`))).toBeVisible({
      timeout: 10_000,
    });

    const row = listItemByText(page, code);
    await row.scrollIntoViewIfNeeded();
    await row.getByRole("button", { name: "Editar" }).click();
    const editRow = editingListItem(page);
    await expect(editRow).toBeVisible();
    await editRow.getByRole("textbox").nth(1).fill("Procedimento E2E Editado");
    await editRow.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText(/Procedimento .* atualizado/)).toBeVisible({ timeout: 10_000 });

    const rowAfterEdit = listItemByText(page, "Procedimento E2E Editado");
    await rowAfterEdit.scrollIntoViewIfNeeded();
    await rowAfterEdit.getByRole("button", { name: "Excluir" }).click();
    await expect(rowAfterEdit).toHaveCount(0, { timeout: 10_000 });
  });

  test("CREATE usuário prestador", async ({ page }) => {
    await page.getByRole("navigation", { name: "Abas da página" }).getByRole("button", { name: "Usuários" }).click();
    const id = suffix();
    const card = page.locator("section, div").filter({ has: page.getByRole("heading", { name: "Novo usuário" }) }).first();
    const form = card.locator("form");
    await form.locator("label").filter({ hasText: /^Nome$/ }).locator("input").fill(`Dr E2E ${id}`);
    await form.locator("label").filter({ hasText: /^E-mail$/ }).locator("input").fill(`dr.e2e.${id}@bibi.health`);
    await form.locator("label").filter({ hasText: /^Senha$/ }).locator("input").fill("bibi123");
    await form.getByRole("button", { name: "Criar usuário" }).click();
    await expect(page.getByText(new RegExp(`Usuário Dr E2E ${id} criado`))).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(`dr.e2e.${id}@bibi.health`)).toBeVisible();
  });
});

test.describe("Cadastros — RBAC recepção", () => {
  test("RECEPCAO acessa e carrega cadastros", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "interno", "recepcao@bibi.health");
    await page.goto("/interno/cadastros");
    await expect(page.getByText(/Carregando cadastros/i)).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByText(/Sem permissão/i)).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Abas da página" }).getByRole("button", { name: "Beneficiários" })).toBeVisible();
  });
});
