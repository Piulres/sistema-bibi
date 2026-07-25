import "server-only";
import { getPrisma } from "@/lib/db";
import { getDataStoreMode } from "@/lib/data-store-mode";
import { persistOperationDatabaseNow } from "@/lib/sqlite-blob-persistence";
import { ensureCedigTenant } from "../../../prisma/seed-data/cedig-catalog";

export const PROVISION_CEDIG_CONFIRM = "CEDIG";

export function isValidProvisionCedigConfirmation(confirm: string | undefined): boolean {
  return confirm?.trim().toUpperCase() === PROVISION_CEDIG_CONFIRM;
}

/**
 * Garante tenant CEDIG (equipe + catálogo + pacientes portal) no banco ativo.
 * Em modo operação, persiste imediatamente em Netlify Blobs.
 */
export async function provisionCedigForOperation(): Promise<{
  tenantId: string;
  created: boolean;
  procedures: number;
  mode: "demo" | "operation";
}> {
  const mode = await getDataStoreMode();
  const prisma = await getPrisma();
  const result = await ensureCedigTenant(prisma, {
    // Operação real: sem lançamentos de homologação; demo pode incluir histórico.
    seedHistory: mode === "demo",
  });

  if (mode === "operation") {
    await persistOperationDatabaseNow();
  }

  return { ...result, mode };
}
