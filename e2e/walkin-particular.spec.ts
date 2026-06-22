import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

/** CPF válido único (dígitos verificadores corretos). */
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

/** Data e horário únicos por execução — evita colisão com seed e runs anteriores. */
function uniqueWalkInSlot(): { date: string; time: string } {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 45 + (Date.now() % 30));
  const halfHour = Math.floor(Date.now() / 1000) % 18;
  const hour = 8 + Math.floor(halfHour / 2);
  const minute = (halfHour % 2) * 30;
  return {
    date: d.toISOString().slice(0, 10),
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

test.describe("Portal Interno — walk-in particular", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
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
    await expect(page.getByText(/Beneficiário \/ paciente/i).first()).toBeVisible();
    await expect(page.getByText(/Prontuário \(PEP\)/i)).toBeVisible();

    const crudCard = page.locator(".ds-card").filter({
      has: page.getByRole("heading", { name: /Mapa de operações CRUD/i }),
    });
    await crudCard.getByRole("button", { name: "Prestador", exact: true }).click();
    await expect(crudCard.getByText(/Uso de procedimento \(PPU\)/i)).toBeVisible();
    await expect(crudCard.getByText(/Beneficiário \/ paciente/i)).toHaveCount(0);
  });

  test("cadastra walk-in particular e confirma chegada", async ({ page }) => {
    const unique = Date.now();
    const cpf = generateValidCpf();
    const walkInName = `Walk-in Teste ${unique}`;

    const { date: slotDate, time: slotTime } = uniqueWalkInSlot();

    await page.goto("/interno/agenda");
    await expect(page.getByText(/Carregando agenda/i)).toHaveCount(0, { timeout: 15_000 });

    await page.getByRole("textbox", { name: "Data" }).fill(slotDate);
    await expect(page.getByText(/Carregando agenda/i)).toHaveCount(0, { timeout: 15_000 });

    const walkInForm = page.locator("#walk-in form");
    await page.locator("#walkin-name").fill(walkInName);
    await page.locator("#walkin-cpf").fill(cpf);
    await page.locator("#walkin-birth").fill("1990-05-15");
    await page.locator("#walkin-provider").selectOption({ label: "Dra. Helena Martins" });
    await walkInForm.locator("#walkin-time").fill(slotTime);

    await page.getByRole("button", { name: /Cadastrar e agendar agora/i }).click();
    await expect(page.getByText(/Walk-in:.*cadastrado.*agendado/i)).toBeVisible({ timeout: 15_000 });

    const card = page.locator(".ds-card").filter({ hasText: walkInName }).last();
    await card.getByRole("button", { name: /Confirmar chegada/i }).click();
    await expect(page.getByText(/Chegada confirmada/i)).toBeVisible();
  });
});
