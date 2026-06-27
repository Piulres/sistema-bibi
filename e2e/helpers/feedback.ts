import { expect, type Page } from "@playwright/test";

/** Mensagens de sucesso/erro via Toast (aria-live) ou inline na página. */
export async function expectFeedbackMessage(
  page: Page,
  pattern: RegExp | string,
  timeout = 15_000,
): Promise<void> {
  await expect(page.getByText(pattern)).toBeVisible({ timeout });
}

/** Confirma ação destrutiva no diálogo modal (useConfirm). */
export async function confirmDialog(
  page: Page,
  options: { title?: RegExp | string; action?: RegExp | string } = {},
): Promise<void> {
  const { title = /Confirmar/i, action = /Excluir|Confirmar|Sim/i } = options;
  const dialog = page.getByRole("alertdialog", { name: title });
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await dialog.getByRole("button", { name: action }).click();
}
