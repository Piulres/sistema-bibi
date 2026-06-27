/** Utilitários para feedback de API (erros, mensagens padrão). */

export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status: number; code?: string };

export function apiErrorMessage(
  status: number,
  body: Record<string, unknown> | null | undefined,
  fallback = "Não foi possível concluir a operação.",
): string {
  if (body && typeof body.error === "string" && body.error.trim()) {
    return body.error;
  }
  if (status === 401) return "Sessão expirada. Faça login novamente.";
  if (status === 403) return "Você não tem permissão para esta ação.";
  if (status === 404) return "Registro não encontrado.";
  if (status === 409) return "Conflito — a operação não pode ser aplicada no estado atual.";
  if (status >= 500) return "Erro interno. Tente novamente em instantes.";
  return fallback;
}

export async function parseApiResponse<T extends Record<string, unknown> = Record<string, unknown>>(
  res: Response,
  fallback?: string,
): Promise<ApiResult<T>> {
  let body: Record<string, unknown> = {};
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    // corpo vazio ou não-JSON
  }

  if (res.ok) {
    return { ok: true, data: body as T, status: res.status };
  }

  return {
    ok: false,
    error: apiErrorMessage(res.status, body, fallback),
    status: res.status,
    code: typeof body.code === "string" ? body.code : undefined,
  };
}

export async function fetchJson<T extends Record<string, unknown> = Record<string, unknown>>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallback?: string,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(input, init);
    return parseApiResponse<T>(res, fallback);
  } catch {
    return {
      ok: false,
      error: "Falha de rede. Verifique sua conexão e tente novamente.",
      status: 0,
    };
  }
}
