/** Configuração central de segurança (sessão, cookies, ambiente). */

const WEAK_SECRETS = new Set([
  "bibi-poc-dev-secret-change-me",
  "bibi-poc-netlify-secret-change-me",
  "change-me-in-production",
  "test-session-secret-32-chars-min",
  "ci-test-session-secret-32chars",
]);

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret) {
    if (isProductionRuntime()) {
      throw new Error("SESSION_SECRET é obrigatório em produção");
    }
    return "bibi-poc-dev-secret-change-me";
  }
  if (isProductionRuntime() && (secret.length < 32 || WEAK_SECRETS.has(secret))) {
    throw new Error("SESSION_SECRET fraco ou padrão — defina um valor único ≥ 32 caracteres");
  }
  return secret;
}

export function sessionCookieOptions(): {
  httpOnly: true;
  sameSite: "lax";
  path: "/";
  maxAge: number;
  secure: boolean;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
    secure: isProductionRuntime(),
  };
}
