import "server-only";
import { getPrisma } from "@/lib/db";
import { mergeNicheLabels } from "@/lib/niche/labels";
import type { NicheLabels } from "@/lib/niche/types";

/** Labels do tenant (sessão autenticada) para PageHeaders server-side. */
export async function getTenantLabelsById(tenantId: string): Promise<NicheLabels> {
  const prisma = await getPrisma();
  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId },
    select: { niche: true, labels: true },
  });
  return mergeNicheLabels(tenant?.niche ?? "MEDICAL", tenant?.labels);
}
