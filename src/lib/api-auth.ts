import "server-only";
import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "@/lib/session";
import {
  hasInternoPermission,
  type InternoModule,
} from "@/lib/interno-permissions";

/** Erro de autorizacao usado para curto-circuitar handlers. */
export class ApiAuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Garante que existe uma sessao valida e (opcionalmente) que o usuario
 * possui um dos roles permitidos. Lanca ApiAuthError caso contrario.
 */
export async function requireUser(roles?: string[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new ApiAuthError(401, "Não autenticado");
  }
  if (roles && !roles.includes(user.role)) {
    throw new ApiAuthError(403, "Acesso negado para este portal");
  }
  return user;
}

/** Garante permissão de módulo no portal interno (RBAC granular). */
export async function requireInternoModule(module: InternoModule): Promise<SessionUser> {
  const user = await requireUser(["INTERNO"]);
  if (!hasInternoPermission(user.role, user.internoProfile, module)) {
    throw new ApiAuthError(403, "Sem permissão para este módulo");
  }
  return user;
}

/** Garante sessão de beneficiário com patientId vinculado. */
export async function requireBeneficiary(): Promise<SessionUser & { patientId: string }> {
  const user = await requireUser(["BENEFICIARIO"]);
  if (!user.patientId) {
    throw new ApiAuthError(403, "Conta sem beneficiário vinculado");
  }
  return { ...user, patientId: user.patientId };
}

export function authErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: "Erro interno" }, { status: 500 });
}
