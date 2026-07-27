import "server-only";
import { getPrisma } from "@/lib/db";
import { recordTimelineEvent, TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline";

/** Tipos outbound (baixa) → compensação ENTRADA; inbound → compensação SAIDA. */
function compensatingMovementType(type: string): "ENTRADA" | "SAIDA" | null {
  if (
    type === "AJUSTE" ||
    type === "SAIDA" ||
    type === "PERDA" ||
    type === "DISPENSACAO" ||
    type === "TRANSFERENCIA"
  ) {
    return "ENTRADA";
  }
  if (type === "ENTRADA" || type === "DEVOLUCAO") {
    return "SAIDA";
  }
  return null;
}

/** Movimento compensatório inverso a uma movimentação de estoque com lote. */
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

  const compensatingType = compensatingMovementType(movement.type);
  if (!compensatingType) {
    return { error: "Tipo de movimentação não suporta reversão automática" as const };
  }

  if (!movement.lotId) {
    return { error: "Reversão requer lote vinculado ao movimento original" as const };
  }

  const lot = await prisma.stockLot.findFirst({
    where: { id: movement.lotId, tenantId: input.tenantId },
  });
  if (!lot) {
    return { error: "Lote vinculado à movimentação não encontrado" as const };
  }

  if (compensatingType === "SAIDA" && lot.quantity < movement.quantity) {
    return {
      error: `Saldo do lote insuficiente para reverter entrada (disponível: ${lot.quantity})` as const,
    };
  }

  const signedQty =
    compensatingType === "ENTRADA" ? `+${movement.quantity}` : `-${movement.quantity}`;
  const timelineAction =
    compensatingType === "ENTRADA" ? TIMELINE_ACTIONS.STOCK_ENTRY : TIMELINE_ACTIONS.STOCK_EXIT;

  await prisma.$transaction(async (tx) => {
    await tx.stockLot.update({
      where: { id: movement.lotId! },
      data: {
        quantity:
          compensatingType === "ENTRADA"
            ? { increment: movement.quantity }
            : { decrement: movement.quantity },
      },
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
        action: timelineAction,
        description: `Reversão de estoque — ${movement.product.name} (${signedQty} ${movement.product.unit})`,
        createdBy: input.createdBy,
        reversesId: movement.id,
        reversible: false,
      },
      tx,
    );
  });

  return { ok: true as const };
}
