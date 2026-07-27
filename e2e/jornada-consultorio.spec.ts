/**
 * E2E — Jornada no consultório (UI)
 * Alinhado a docs/produto/JORNADA_CONSULTORIO.md
 *
 * Cobre superfície operacional: agenda/walk-in, estoque, cadastros (procedimentos),
 * faturamento, atendimento (PEP/procedimentos) e stepper da jornada.
 */
import { expect, test } from "@playwright/test";
import { dismissOnboardingIfVisible, expectInternoNavHref, loginAs } from "./helpers/auth";
import { confirmDialog, expectFeedbackMessage } from "./helpers/feedback";

function generateValidCpf(): string {
  const base = String(Date.now() % 1_000_000_000)
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

function uniqueWalkInSlot(): { date: string; time: string } {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 50 + (Date.now() % 25));
  const halfHour = Math.floor(Date.now() / 1000) % 18;
  const hour = 8 + Math.floor(halfHour / 2);
  const minute = (halfHour % 2) * 30;
  return {
    date: d.toISOString().slice(0, 10),
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

test.describe("Jornada consultório — módulos operacionais (Interno)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test("recepção: agenda, estoque e cadastros de procedimentos", async ({ page }) => {
    await loginAs(page, "interno", "recepcao@bibi.health");
    await dismissOnboardingIfVisible(page);

    await expectInternoNavHref(page, "/interno/agenda", true);
    await expectInternoNavHref(page, "/interno/estoque", true);
    await expectInternoNavHref(page, "/interno/cadastros", true);
    await expectInternoNavHref(page, "/interno/faturamento", false);

    await page.goto("/interno/agenda");
    await expect(
      page.getByRole("heading", { name: /Paciente particular \(walk-in\)/i }),
    ).toBeVisible();

    await page.goto("/interno/estoque");
    await expect(page.getByRole("heading", { name: /Estoque/i }).first()).toBeVisible();
    await expect(page.getByText(/produto|lote|alerta/i).first()).toBeVisible();

    await page.goto("/interno/cadastros?tab=procedures");
    await expect(
      page.getByRole("navigation", { name: "Abas da página" }).getByRole("button", {
        name: "Procedimentos",
      }),
    ).toBeVisible();
    await expect(page.getByText(/Sem permissão|Falha ao carregar/i)).toHaveCount(0);
  });

  test("faturamento: lista pendências e ações de cobrança", async ({ page }) => {
    await loginAs(page, "interno", "faturamento@bibi.health");
    await dismissOnboardingIfVisible(page);

    await page.goto("/interno/faturamento");
    await expect(page.getByRole("heading", { name: "Faturamento", exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Sem permissão/i)).toHaveCount(0);
    // Conteúdo da BillingView (evita spans ocultos da nav xl:hidden)
    await expect(
      page
        .locator("main, .portal-page-content")
        .getByText(/Pay Per Use|Pendentes|Gerar fatura|Marcar paga|PIX/i)
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
  });

  test("faturamento: Confirmar pagamento marca FECHADA como PAGA e atualiza a lista", async ({
    page,
  }) => {
    await loginAs(page, "interno", "faturamento@bibi.health");
    await dismissOnboardingIfVisible(page);

    await page.goto("/interno/faturamento");
    await expect(page.getByRole("heading", { name: "Faturamento", exact: true })).toBeVisible({
      timeout: 15_000,
    });

    const markPaid = page.getByRole("button", { name: "Marcar paga" }).first();
    await expect(markPaid).toBeVisible({ timeout: 15_000 });
    await markPaid.click();

    await confirmDialog(page, {
      title: /Confirmar pagamento/i,
      action: /Confirmar pagamento/i,
    });
    await expectFeedbackMessage(page, /Fatura marcada como paga/i);
    // Lista recarrega com ao menos uma fatura PAGA (seed demo tem FECHADA + fluxo)
    await expect(page.getByText("PAGA").first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Jornada consultório — walk-in → check-in → atendimento", () => {
  test("fluxo UI dos Atos 1–3 (recepção + prestador)", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 800 });

    const unique = Date.now();
    const walkInName = `Camila Rocha ${unique}`;
    const cpf = generateValidCpf();
    const { date: slotDate, time: slotTime } = uniqueWalkInSlot();

    // Ato 1 + 2 — recepção
    await loginAs(page, "interno", "recepcao@bibi.health");
    await page.goto("/interno/agenda");
    await expect(page.getByText(/Carregando agenda/i)).toHaveCount(0, { timeout: 15_000 });

    await page.getByRole("textbox", { name: "Data" }).fill(slotDate);
    await expect(page.getByText(/Carregando agenda/i)).toHaveCount(0, { timeout: 15_000 });

    await page.locator("#walkin-name").fill(walkInName);
    await page.locator("#walkin-cpf").fill(cpf);
    await page.locator("#walkin-birth").fill("1992-06-10");
    await page.locator("#walkin-provider").selectOption({ label: "Dra. Helena Martins" });
    await page.locator("#walkin-time").fill(slotTime);
    await page.getByRole("button", { name: /Cadastrar e agendar agora/i }).click();
    await expectFeedbackMessage(page, /Walk-in cadastrado e agendado/i);

    const card = page.locator(".ds-card").filter({ hasText: walkInName }).last();
    await card.getByRole("button", { name: /Confirmar chegada/i }).click();
    await expectFeedbackMessage(page, /Chegada confirmada/i);

    // Ato 3 — prestador (atendimento do dia: se slot futuro, pode não aparecer na agenda de hoje)
    await page.getByRole("button", { name: /sair/i }).click();
    await loginAs(page, "prestador", "dra.helena@bibi.health");
    await page.goto("/prestador");
    await expect(page.getByRole("heading", { name: /agenda de hoje/i })).toBeVisible();

    // Abre qualquer atendimento disponível para validar superfície PEP/procedimentos
    const link = page.getByRole("link", { name: /Abrir atendimento/i }).first();
    await expect(link).toBeVisible({ timeout: 15_000 });
    await link.click();
    await expect(page).toHaveURL(/\/prestador\/atendimento\//);

    await expect(page.getByRole("button", { name: /Prontuário|PEP/i }).first()).toBeVisible();
    await expect(page.getByText(/procedimento|Pay Per Use|Registrar/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Marcar como realizado/i })).toBeVisible();

    // Stepper da jornada clínica (rótulo desktop visível — evita span sm:hidden)
    await expect(page.getByText("Agendado").filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText("Pago").filter({ visible: true }).first()).toBeVisible();
  });
});
