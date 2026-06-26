/** Desliga auto-start do tour (E2E/CI) — manual via botão Tour continua disponível. */
export function isOnboardingAutoStartEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DISABLE_ONBOARDING_AUTO !== "true";
}
