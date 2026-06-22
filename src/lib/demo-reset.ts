import "server-only";
import type { PrismaClient } from "@prisma/client";
import { runDatabaseSeed, type SeedRunResult } from "../../prisma/seed-data/run-seed";
import { isInternoAdmin } from "@/lib/interno-permissions";
import type { SessionUser } from "@/lib/session";

let resetInProgress = false;

/** Habilita o botão de restaurar demo (habilitado por padrão; use ALLOW_DEMO_RESET=false para desligar). */
export function isDemoResetEnabled(): boolean {
  const flag = process.env.ALLOW_DEMO_RESET?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  return true;
}

export function canUserResetDemo(user: SessionUser): boolean {
  return isInternoAdmin(user.role, user.internoProfile);
}

export type DemoResetStatus = {
  enabled: boolean;
  canReset: boolean;
  inProgress: boolean;
};

export function getDemoResetStatus(user: SessionUser): DemoResetStatus {
  const enabled = isDemoResetEnabled();
  return {
    enabled,
    canReset: enabled && canUserResetDemo(user),
    inProgress: resetInProgress,
  };
}

const CONFIRM_PHRASE = "RESTAURAR";

export function isValidDemoResetConfirmation(confirm: unknown): boolean {
  return typeof confirm === "string" && confirm.trim().toUpperCase() === CONFIRM_PHRASE;
}

export { CONFIRM_PHRASE as DEMO_RESET_CONFIRM_PHRASE };

/** Executa o seed completo e invalida sessões (IDs são recriados). */
export async function executeDemoReset(prisma: PrismaClient): Promise<SeedRunResult> {
  if (!isDemoResetEnabled()) {
    throw new DemoResetError(403, "Restauração demo desabilitada neste ambiente");
  }
  if (resetInProgress) {
    throw new DemoResetError(409, "Restauração demo já em andamento");
  }

  resetInProgress = true;
  try {
    return await runDatabaseSeed(prisma);
  } finally {
    resetInProgress = false;
  }
}

export class DemoResetError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
