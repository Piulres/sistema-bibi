import { expect, test, type Page } from "@playwright/test";
import { dismissOnboardingIfVisible, loginAs } from "./helpers/auth";

/** Garante um AGENDADO de hoje para a Dra. Helena — evita flake entre projetos chromium/mobile. */
async function ensureTodayAgendadoForHelena(page: Page): Promise<void> {
  await loginAs(page, "interno", "recepcao@bibi.health");

  const listRes = await page.request.get("/api/interno/appointments");
  expect(listRes.ok(), await listRes.text()).toBeTruthy();
  const list = (await listRes.json()) as {
    providers: { id: string; email: string | null }[];
    patients: { id: string }[];
  };

  const helena = list.providers.find((p) => p.email === "dra.helena@bibi.health");
  const patient = list.patients[0];
  expect(helena, "prestador dra.helena no seed").toBeTruthy();
  expect(patient, "paciente no seed").toBeTruthy();

  const slot = new Date();
  // Horário único no dia local do runner — evita colisão com seed e runs paralelos de projeto
  const uniqueMinute = 5 + (Date.now() % 50);
  slot.setHours(18, uniqueMinute, 0, 0);

  const createRes = await page.request.post("/api/interno/appointments", {
    data: {
      patientId: patient!.id,
      providerId: helena!.id,
      scheduledAt: slot.toISOString(),
      status: "AGENDADO",
      reason: `E2E confirmar presença ${Date.now()}`,
    },
  });
  expect(createRes.ok(), await createRes.text()).toBeTruthy();
}

test.describe("Melhorias de fluxo — mapa interno", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "interno", "recepcao@bibi.health");
  });

  test("mapa de melhorias de fluxo visível em cadastros", async ({ page }) => {
    await page.goto("/interno/cadastros?tab=operations");
    await expect(page.getByRole("heading", { name: /Mapa de melhorias de fluxo/i })).toBeVisible();
    await expect(page.getByText(/Cancelar consulta agendada/i)).toBeVisible();
    await expect(page.getByText(/Confirmar presença do paciente/i)).toBeVisible();
  });
});

test.describe("Portal Prestador — confirmar presença", () => {
  test("botão Paciente presente na tela de atendimento", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await ensureTodayAgendadoForHelena(page);

    await loginAs(page, "prestador", "dra.helena@bibi.health");
    await page.goto("/prestador");
    await dismissOnboardingIfVisible(page);
    await expect(page.getByRole("heading", { name: /Agenda de hoje/i })).toBeVisible();

    const agendadoCard = page.locator("li").filter({ hasText: "AGENDADO" }).first();
    await expect(agendadoCard).toBeVisible({ timeout: 15_000 });

    const link = agendadoCard.getByRole("link", { name: /Abrir atendimento/i });
    await link.click();
    await expect(page).toHaveURL(/\/prestador\/atendimento\//);

    const presentBtn = page.getByRole("button", { name: /Paciente presente/i });
    await expect(presentBtn).toBeVisible();
    await presentBtn.scrollIntoViewIfNeeded();
    await presentBtn.click();
    await expect(page.getByText(/presença do paciente confirmada/i)).toBeVisible();
  });
});

test.describe("Portal Beneficiário — agenda com cards", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "beneficiario", "joao.pereira@email.com");
  });

  test("seção Minha agenda com cards", async ({ page }) => {
    await page.goto("/beneficiario/agenda");
    await expect(page.getByRole("heading", { name: /Minha agenda/i })).toBeVisible();
  });
});
