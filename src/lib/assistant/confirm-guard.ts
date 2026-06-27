import "server-only";
import { hasInternoPermission, isInternoAdmin } from "@/lib/interno-permissions";
import type { PendingActionPayload } from "@/lib/assistant/types";
import type { SessionUser } from "@/lib/session";

export class ConfirmPermissionError extends Error {
  status = 403 as const;
  constructor(message: string) {
    super(message);
    this.name = "ConfirmPermissionError";
  }
}

/** Revalida RBAC na confirmação — alinhado às APIs REST de cada operação. */
export function assertPendingActionPermission(
  user: SessionUser,
  payload: PendingActionPayload,
): void {
  switch (payload.type) {
    case "create_user": {
      if (!isInternoAdmin(user.role, user.internoProfile)) {
        throw new ConfirmPermissionError(
          "Somente administradores podem criar usuários pelo assistente.",
        );
      }
      return;
    }
    case "create_patient": {
      if (
        user.role !== "INTERNO" ||
        !hasInternoPermission(user.role, user.internoProfile, "cadastros")
      ) {
        throw new ConfirmPermissionError("Sem permissão para cadastrar pacientes.");
      }
      return;
    }
    case "create_appointment": {
      if (
        user.role !== "INTERNO" ||
        !hasInternoPermission(user.role, user.internoProfile, "agenda")
      ) {
        throw new ConfirmPermissionError("Sem permissão para agendar.");
      }
      return;
    }
    case "book_appointment": {
      if (user.role !== "BENEFICIARIO" || !user.patientId) {
        throw new ConfirmPermissionError("Ação disponível apenas para beneficiários.");
      }
      return;
    }
    default:
      throw new ConfirmPermissionError("Ação não permitida.");
  }
}
