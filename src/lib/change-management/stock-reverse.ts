import "server-only";
import { getPrisma } from "@/lib/db";
import { recordTimelineEvent, TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline";

/** Movimento compensatório inverso a um ajuste/saída de estoque. */
export async function reverseStockMovement(input: {
  tenantId: string;
  movementId: string;
  createdBy: string;
  reason?: string;
}) {
  const prisma = await getPrisma();
  const movement = await prisma.stockMovement.findFirst({
    where: { id: input.movementId, tenantId: input.tenantId },
    include: { product: { select: { name: true, unit: true } }, lot: true },
  });
  if (!movement) return null;

  const compensatingType =
    movement.type === "AJUSTE" || movement.type === "SAIDA" || movement.type === "PERDA"
      ? "ENTRADA"
      : movement.type === "ENTRADA"
        ? "SAIDA"
        : null;

  if (!compensatingType) {
    return { error: "Tipo de movimentação não suporta reversão automática" as const };
  }

  if (movement.lotId && compensatingType === "ENTRADA") {
    await prisma.$transaction(async (tx) => {
      await tx.stockLot.update({
        where: { id: movement.lotId! },
        data: { quantity: { increment: movement.quantity } },
      });
      const reverse = await tx.stockMovement.create({
        data: {
          tenantId: input.tenantId,
          productId: movement.productId,
          lotId: movement.lotId,
          type: compensatingType,
          quantity: movement.quantity,
          unitCost: movement.unitCost,
          reason: input.reason ?? `Reversão de ${movement.id.slice(0, 8)}`,
          createdBy: input.createdBy,
        },
      });
      await recordTimelineEvent(
        {
          tenantId: input.tenantId,
          entityType: TIMELINE_ENTITY_TYPES.STOCK_MOVEMENT,
          entityId: reverse.id,
          action: TIMELINE_ACTIONS.STOCK_ENTRY,
          description: `Reversão de estoque — ${movement.product.name} (+${movement.quantity} ${movement.product.unit})`,
          createdBy: input.createdBy,
          reversesId: movement.id,
          reversible: false,
        },
        tx,
      );
    });
    return { ok: true as const };
  }

  return { error: "Reversão requer lote vinculado ao movimento original" as const };
}
