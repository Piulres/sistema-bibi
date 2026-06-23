import "server-only";
import type { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import {
  recordTimelineEvent,
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "@/lib/timeline";
import {
  STOCK_EXPIRY_ALERT_DAYS,
  isStockInbound,
  isStockLotStatus,
  isStockMovementType,
  isStockOutbound,
  isStockProductCategory,
  isStockUnit,
  type StockLotStatus,
  type StockMovementType,
} from "@/lib/stock-constants";

export type MedicalProductView = {
  id: string;
  sku: string;
  name: string;
  category: string;
  categoryLabel: string;
  unit: string;
  minStock: number;
  anvisaCode: string | null;
  requiresLot: boolean;
  active: boolean;
  totalStock: number;
  stockLabel: string;
  lowStock: boolean;
};

export type StockLotView = {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  lotNumber: string;
  expiryDate: string;
  expiryDateLabel: string;
  quantity: number;
  unitCost: number;
  unitCostLabel: string;
  status: string;
  statusLabel: string;
  supplierRef: string | null;
  daysToExpiry: number;
  expiringSoon: boolean;
};

export type StockMovementView = {
  id: string;
  type: string;
  typeLabel: string;
  productId: string;
  productName: string;
  productSku: string;
  lotNumber: string | null;
  quantity: number;
  unitCost: number | null;
  reason: string | null;
  patientId: string | null;
  appointmentId: string | null;
  createdAt: string;
  createdAtLabel: string;
};

export type StockAlertView = {
  kind: "LOW_STOCK" | "EXPIRING" | "EXPIRED" | "BLOCKED";
  productId: string;
  productName: string;
  productSku: string;
  message: string;
  severity: "warning" | "danger" | "info";
  lotId?: string;
  lotNumber?: string;
  expiryDateLabel?: string;
  currentStock?: number;
  minStock?: number;
};

const dateLabel = (value: Date) =>
  value.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

const dateTimeLabel = (value: Date) =>
  value.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

async function sumProductStock(
  tenantId: string,
  productId: string,
  client?: Prisma.TransactionClient,
): Promise<number> {
  const db = client ?? (await getPrisma());
  const lots = await db.stockLot.findMany({
    where: { tenantId, productId, status: "DISPONIVEL" },
    select: { quantity: true },
  });
  return lots.reduce((sum, lot) => sum + lot.quantity, 0);
}

function mapProduct(
  p: {
    id: string;
    sku: string;
    name: string;
    category: string;
    unit: string;
    minStock: number;
    anvisaCode: string | null;
    requiresLot: boolean;
    active: boolean;
  },
  totalStock: number,
): MedicalProductView {
  const categoryLabel =
    p.category === "MEDICAMENTO"
      ? "Medicamento"
      : p.category === "MATERIAL"
        ? "Material médico"
        : p.category === "OPME"
          ? "OPME"
          : "Insumo";

  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    categoryLabel,
    unit: p.unit,
    minStock: p.minStock,
    anvisaCode: p.anvisaCode,
    requiresLot: p.requiresLot,
    active: p.active,
    totalStock,
    stockLabel: `${totalStock} ${p.unit}`,
    lowStock: p.active && totalStock < p.minStock,
  };
}

export async function listMedicalProducts(tenantId: string): Promise<MedicalProductView[]> {
  const prisma = await getPrisma();
  const products = await prisma.medicalProduct.findMany({
    where: { tenantId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const views: MedicalProductView[] = [];
  for (const product of products) {
    const totalStock = await sumProductStock(tenantId, product.id);
    views.push(mapProduct(product, totalStock));
  }
  return views;
}

export async function createMedicalProduct(input: {
  tenantId: string;
  sku: string;
  name: string;
  category: string;
  unit?: string;
  minStock?: number;
  anvisaCode?: string | null;
  requiresLot?: boolean;
  createdBy: string;
}) {
  if (!isStockProductCategory(input.category)) {
    return { error: "Categoria inválida" as const };
  }
  if (input.unit && !isStockUnit(input.unit)) {
    return { error: "Unidade inválida" as const };
  }

  const prisma = await getPrisma();
  const sku = input.sku.trim().toUpperCase();
  const existing = await prisma.medicalProduct.findFirst({
    where: { tenantId: input.tenantId, sku },
  });
  if (existing) return { error: "SKU já cadastrado" as const };

  const product = await prisma.medicalProduct.create({
    data: {
      tenantId: input.tenantId,
      sku,
      name: input.name.trim(),
      category: input.category,
      unit: input.unit ?? "UN",
      minStock: input.minStock ?? 0,
      anvisaCode: input.anvisaCode?.trim() || null,
      requiresLot: input.requiresLot ?? true,
    },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.MEDICAL_PRODUCT,
    entityId: product.id,
    action: TIMELINE_ACTIONS.CREATED,
    description: `Produto ${product.sku} — ${product.name} cadastrado no estoque`,
    createdBy: input.createdBy,
  });

  return { product: mapProduct(product, 0) };
}

export async function updateMedicalProduct(input: {
  tenantId: string;
  productId: string;
  name?: string;
  minStock?: number;
  anvisaCode?: string | null;
  active?: boolean;
  updatedBy: string;
}) {
  const prisma = await getPrisma();
  const existing = await prisma.medicalProduct.findFirst({
    where: { id: input.productId, tenantId: input.tenantId },
  });
  if (!existing) return { error: "Produto não encontrado" as const };

  const product = await prisma.medicalProduct.update({
    where: { id: input.productId },
    data: {
      name: input.name?.trim() ?? undefined,
      minStock: input.minStock,
      anvisaCode: input.anvisaCode === undefined ? undefined : input.anvisaCode?.trim() || null,
      active: input.active,
    },
  });

  const totalStock = await sumProductStock(input.tenantId, product.id);

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.MEDICAL_PRODUCT,
    entityId: product.id,
    action: TIMELINE_ACTIONS.UPDATED,
    description: `Produto ${product.sku} atualizado no estoque`,
    createdBy: input.updatedBy,
  });

  return { product: mapProduct(product, totalStock) };
}

export async function listStockLots(
  tenantId: string,
  filters?: { productId?: string; status?: string },
): Promise<StockLotView[]> {
  const prisma = await getPrisma();
  const now = new Date();
  const lots = await prisma.stockLot.findMany({
    where: {
      tenantId,
      productId: filters?.productId,
      status: filters?.status,
    },
    include: { product: true },
    orderBy: [{ expiryDate: "asc" }, { lotNumber: "asc" }],
  });

  return lots.map((lot) => {
    const daysToExpiry = daysBetween(now, lot.expiryDate);
    return {
      id: lot.id,
      productId: lot.productId,
      productName: lot.product.name,
      productSku: lot.product.sku,
      lotNumber: lot.lotNumber,
      expiryDate: lot.expiryDate.toISOString(),
      expiryDateLabel: dateLabel(lot.expiryDate),
      quantity: lot.quantity,
      unitCost: lot.unitCost,
      unitCostLabel: formatBRL(lot.unitCost),
      status: lot.status,
      statusLabel:
        lot.status === "DISPONIVEL"
          ? "Disponível"
          : lot.status === "VENCIDO"
            ? "Vencido"
            : lot.status === "QUARENTENA"
              ? "Quarentena"
              : "Bloqueado",
      supplierRef: lot.supplierRef,
      daysToExpiry,
      expiringSoon: daysToExpiry >= 0 && daysToExpiry <= STOCK_EXPIRY_ALERT_DAYS,
    };
  });
}

export async function receiveStockEntry(input: {
  tenantId: string;
  productId: string;
  lotNumber: string;
  expiryDate: Date;
  quantity: number;
  unitCost?: number;
  supplierRef?: string | null;
  createdBy: string;
}) {
  if (input.quantity <= 0) return { error: "Quantidade deve ser maior que zero" as const };

  const prisma = await getPrisma();
  const product = await prisma.medicalProduct.findFirst({
    where: { id: input.productId, tenantId: input.tenantId, active: true },
  });
  if (!product) return { error: "Produto não encontrado ou inativo" as const };

  const lotNumber = input.lotNumber.trim().toUpperCase();
  const existingLot = await prisma.stockLot.findFirst({
    where: { productId: product.id, lotNumber },
  });

  const result = await prisma.$transaction(async (tx) => {
    let lotId: string;
    if (existingLot) {
      const updated = await tx.stockLot.update({
        where: { id: existingLot.id },
        data: {
          quantity: { increment: input.quantity },
          unitCost: input.unitCost ?? existingLot.unitCost,
          supplierRef: input.supplierRef ?? existingLot.supplierRef,
          status: "DISPONIVEL",
        },
      });
      lotId = updated.id;
    } else {
      const created = await tx.stockLot.create({
        data: {
          tenantId: input.tenantId,
          productId: product.id,
          lotNumber,
          expiryDate: input.expiryDate,
          quantity: input.quantity,
          unitCost: input.unitCost ?? 0,
          supplierRef: input.supplierRef?.trim() || null,
          status: "DISPONIVEL",
        },
      });
      lotId = created.id;
    }

    const movement = await tx.stockMovement.create({
      data: {
        tenantId: input.tenantId,
        productId: product.id,
        lotId,
        type: "ENTRADA",
        quantity: input.quantity,
        unitCost: input.unitCost ?? null,
        reason: existingLot
          ? `Reforço do lote ${lotNumber}`
          : `Entrada inicial do lote ${lotNumber}`,
        createdBy: input.createdBy,
      },
    });

    return { lotId, movementId: movement.id };
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.STOCK_MOVEMENT,
    entityId: result.movementId,
    action: TIMELINE_ACTIONS.STOCK_ENTRY,
    description: `Entrada de ${input.quantity} ${product.unit} — ${product.name} (lote ${lotNumber})`,
    createdBy: input.createdBy,
  });

  return { ok: true as const };
}

/** Baixa FIFO em lotes disponíveis (validade mais próxima primeiro). */
async function deductStockFifo(
  tx: Prisma.TransactionClient,
  input: {
    tenantId: string;
    productId: string;
    quantity: number;
    type: StockMovementType;
    reason?: string | null;
    appointmentId?: string | null;
    patientId?: string | null;
    procedureUsageId?: string | null;
    createdBy?: string | null;
  },
): Promise<{ movementIds: string[] } | { error: string }> {
  if (!isStockOutbound(input.type) && input.type !== "AJUSTE") {
    return { error: "Tipo de movimentação inválido para baixa" };
  }

  let remaining = input.quantity;
  const lots = await tx.stockLot.findMany({
    where: {
      tenantId: input.tenantId,
      productId: input.productId,
      status: "DISPONIVEL",
      quantity: { gt: 0 },
    },
    orderBy: { expiryDate: "asc" },
  });

  const available = lots.reduce((sum, lot) => sum + lot.quantity, 0);
  if (available < remaining) {
    return { error: `Estoque insuficiente (disponível: ${available})` };
  }

  const movementIds: string[] = [];
  for (const lot of lots) {
    if (remaining <= 0) break;
    const take = Math.min(lot.quantity, remaining);
    await tx.stockLot.update({
      where: { id: lot.id },
      data: { quantity: { decrement: take } },
    });

    const movement = await tx.stockMovement.create({
      data: {
        tenantId: input.tenantId,
        productId: input.productId,
        lotId: lot.id,
        type: input.type,
        quantity: take,
        unitCost: lot.unitCost,
        reason: input.reason,
        appointmentId: input.appointmentId,
        patientId: input.patientId,
        procedureUsageId: input.procedureUsageId,
        createdBy: input.createdBy,
      },
    });
    movementIds.push(movement.id);
    remaining -= take;
  }

  return { movementIds };
}

export async function registerStockMovement(input: {
  tenantId: string;
  productId: string;
  type: string;
  quantity: number;
  lotId?: string | null;
  reason?: string | null;
  appointmentId?: string | null;
  patientId?: string | null;
  createdBy: string;
}) {
  if (!isStockMovementType(input.type)) {
    return { error: "Tipo de movimentação inválido" as const };
  }
  if (input.quantity <= 0) return { error: "Quantidade deve ser maior que zero" as const };

  const prisma = await getPrisma();
  const product = await prisma.medicalProduct.findFirst({
    where: { id: input.productId, tenantId: input.tenantId, active: true },
  });
  if (!product) return { error: "Produto não encontrado ou inativo" as const };

  const type = input.type as StockMovementType;

  if (isStockOutbound(type) || type === "AJUSTE") {
    if (type === "AJUSTE" && input.lotId) {
      const lot = await prisma.stockLot.findFirst({
        where: { id: input.lotId, tenantId: input.tenantId, productId: product.id },
      });
      if (!lot) return { error: "Lote não encontrado" as const };
      if (lot.quantity < input.quantity) {
        return { error: `Saldo do lote insuficiente (${lot.quantity})` as const };
      }

      const movement = await prisma.$transaction(async (tx) => {
        await tx.stockLot.update({
          where: { id: lot.id },
          data: { quantity: { decrement: input.quantity } },
        });
        return tx.stockMovement.create({
          data: {
            tenantId: input.tenantId,
            productId: product.id,
            lotId: lot.id,
            type,
            quantity: input.quantity,
            unitCost: lot.unitCost,
            reason: input.reason,
            createdBy: input.createdBy,
          },
        });
      });

      await recordTimelineEvent({
        tenantId: input.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.STOCK_MOVEMENT,
        entityId: movement.id,
        action: TIMELINE_ACTIONS.STOCK_ADJUSTED,
        description: `Ajuste de estoque — ${product.name} (-${input.quantity} ${product.unit})`,
        createdBy: input.createdBy,
      });

      return { ok: true as const };
    }

    const result = await prisma.$transaction(async (tx) =>
      deductStockFifo(tx, {
        tenantId: input.tenantId,
        productId: product.id,
        quantity: input.quantity,
        type,
        reason: input.reason,
        appointmentId: input.appointmentId,
        patientId: input.patientId,
        createdBy: input.createdBy,
      }),
    );

    if ("error" in result) return { error: result.error as string };

    const action =
      type === "DISPENSACAO"
        ? TIMELINE_ACTIONS.STOCK_DISPENSED
        : type === "PERDA"
          ? TIMELINE_ACTIONS.STOCK_LOSS
          : TIMELINE_ACTIONS.STOCK_EXIT;

    for (const movementId of result.movementIds) {
      await recordTimelineEvent({
        tenantId: input.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.STOCK_MOVEMENT,
        entityId: movementId,
        action,
        description: `${type} — ${product.name} (${input.quantity} ${product.unit})`,
        createdBy: input.createdBy,
      });
    }

    return { ok: true as const };
  }

  if (isStockInbound(type)) {
    if (!input.lotId) return { error: "Informe o lote para devolução" as const };
    const lot = await prisma.stockLot.findFirst({
      where: { id: input.lotId, tenantId: input.tenantId, productId: product.id },
    });
    if (!lot) return { error: "Lote não encontrado" as const };

    const movement = await prisma.$transaction(async (tx) => {
      await tx.stockLot.update({
        where: { id: lot.id },
        data: {
          quantity: { increment: input.quantity },
          status: lot.status === "VENCIDO" ? "QUARENTENA" : lot.status,
        },
      });
      return tx.stockMovement.create({
        data: {
          tenantId: input.tenantId,
          productId: product.id,
          lotId: lot.id,
          type,
          quantity: input.quantity,
          unitCost: lot.unitCost,
          reason: input.reason,
          createdBy: input.createdBy,
        },
      });
    });

    await recordTimelineEvent({
      tenantId: input.tenantId,
      entityType: TIMELINE_ENTITY_TYPES.STOCK_MOVEMENT,
      entityId: movement.id,
      action: TIMELINE_ACTIONS.STOCK_ENTRY,
      description: `Devolução — ${product.name} (+${input.quantity} ${product.unit})`,
      createdBy: input.createdBy,
    });

    return { ok: true as const };
  }

  return { error: "Operação não suportada" as const };
}

export async function listStockMovements(
  tenantId: string,
  limit = 50,
): Promise<StockMovementView[]> {
  const prisma = await getPrisma();
  const rows = await prisma.stockMovement.findMany({
    where: { tenantId },
    include: { product: true, lot: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((m) => ({
    id: m.id,
    type: m.type,
    typeLabel:
      m.type === "ENTRADA"
        ? "Entrada"
        : m.type === "DISPENSACAO"
          ? "Dispensação"
          : m.type === "PERDA"
            ? "Perda"
            : m.type === "DEVOLUCAO"
              ? "Devolução"
              : m.type === "AJUSTE"
                ? "Ajuste"
                : "Saída",
    productId: m.productId,
    productName: m.product.name,
    productSku: m.product.sku,
    lotNumber: m.lot?.lotNumber ?? null,
    quantity: m.quantity,
    unitCost: m.unitCost,
    reason: m.reason,
    patientId: m.patientId,
    appointmentId: m.appointmentId,
    createdAt: m.createdAt.toISOString(),
    createdAtLabel: dateTimeLabel(m.createdAt),
  }));
}

export async function getStockAlerts(tenantId: string): Promise<StockAlertView[]> {
  const prisma = await getPrisma();
  const now = new Date();
  const alerts: StockAlertView[] = [];

  const products = await prisma.medicalProduct.findMany({
    where: { tenantId, active: true },
  });

  for (const product of products) {
    const totalStock = await sumProductStock(tenantId, product.id);
    if (totalStock < product.minStock) {
      alerts.push({
        kind: "LOW_STOCK",
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        message: `Estoque abaixo do mínimo (${totalStock}/${product.minStock} ${product.unit})`,
        severity: totalStock === 0 ? "danger" : "warning",
        currentStock: totalStock,
        minStock: product.minStock,
      });
    }
  }

  const lots = await prisma.stockLot.findMany({
    where: { tenantId, quantity: { gt: 0 } },
    include: { product: true },
    orderBy: { expiryDate: "asc" },
  });

  for (const lot of lots) {
    const days = daysBetween(now, lot.expiryDate);
    if (days < 0) {
      alerts.push({
        kind: "EXPIRED",
        productId: lot.productId,
        productName: lot.product.name,
        productSku: lot.product.sku,
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        expiryDateLabel: dateLabel(lot.expiryDate),
        message: `Lote ${lot.lotNumber} vencido (${dateLabel(lot.expiryDate)})`,
        severity: "danger",
      });
    } else if (days <= STOCK_EXPIRY_ALERT_DAYS) {
      alerts.push({
        kind: "EXPIRING",
        productId: lot.productId,
        productName: lot.product.name,
        productSku: lot.product.sku,
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        expiryDateLabel: dateLabel(lot.expiryDate),
        message: `Lote ${lot.lotNumber} vence em ${days} dias`,
        severity: days <= 30 ? "warning" : "info",
      });
    }

    if (lot.status === "BLOQUEADO" || lot.status === "QUARENTENA") {
      alerts.push({
        kind: "BLOCKED",
        productId: lot.productId,
        productName: lot.product.name,
        productSku: lot.product.sku,
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        message: `Lote ${lot.lotNumber} em ${lot.status === "QUARENTENA" ? "quarentena" : "bloqueio"}`,
        severity: "warning",
      });
    }
  }

  return alerts;
}

export async function getStockOverview(tenantId: string) {
  const prisma = await getPrisma();
  const [productCount, lotCount, movementCount, alerts] = await Promise.all([
    prisma.medicalProduct.count({ where: { tenantId, active: true } }),
    prisma.stockLot.count({ where: { tenantId, status: "DISPONIVEL", quantity: { gt: 0 } } }),
    prisma.stockMovement.count({
      where: {
        tenantId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    getStockAlerts(tenantId),
  ]);

  const lots = await prisma.stockLot.findMany({
    where: { tenantId, status: "DISPONIVEL" },
    select: { quantity: true, unitCost: true },
  });
  const inventoryValue = lots.reduce((sum, lot) => sum + lot.quantity * lot.unitCost, 0);

  return {
    productCount,
    activeLotCount: lotCount,
    movementsLast30Days: movementCount,
    inventoryValue,
    inventoryValueLabel: formatBRL(inventoryValue),
    alertCount: alerts.length,
    criticalAlerts: alerts.filter((a) => a.severity === "danger").length,
    alerts: alerts.slice(0, 10),
  };
}

/** Baixa automática dos materiais do kit vinculado ao procedimento. */
export async function consumeProcedureKit(input: {
  tenantId: string;
  procedureId: string;
  appointmentId: string;
  patientId: string;
  procedureUsageId: string;
  createdBy: string;
}): Promise<{ consumed: { productName: string; quantity: number }[]; warnings: string[] }> {
  const prisma = await getPrisma();
  const kit = await prisma.procedureMaterialKit.findMany({
    where: { tenantId: input.tenantId, procedureId: input.procedureId },
    include: { product: true },
  });

  const consumed: { productName: string; quantity: number }[] = [];
  const warnings: string[] = [];

  for (const item of kit) {
    if (!item.product.active) continue;
    const result = await prisma.$transaction(async (tx) =>
      deductStockFifo(tx, {
        tenantId: input.tenantId,
        productId: item.productId,
        quantity: item.quantity,
        type: "DISPENSACAO",
        reason: `Kit do procedimento — atendimento ${input.appointmentId.slice(0, 8)}`,
        appointmentId: input.appointmentId,
        patientId: input.patientId,
        procedureUsageId: input.procedureUsageId,
        createdBy: input.createdBy,
      }),
    );

    if ("error" in result) {
      warnings.push(`${item.product.name}: ${result.error}`);
      continue;
    }

    consumed.push({ productName: item.product.name, quantity: item.quantity });

    for (const movementId of result.movementIds) {
      await recordTimelineEvent({
        tenantId: input.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.STOCK_MOVEMENT,
        entityId: movementId,
        action: TIMELINE_ACTIONS.STOCK_DISPENSED,
        description: `Kit procedimento — ${item.product.name} (${item.quantity} ${item.product.unit})`,
        createdBy: input.createdBy,
      });
    }
  }

  return { consumed, warnings };
}

export async function listProcedureKit(tenantId: string, procedureId: string) {
  const prisma = await getPrisma();
  const items = await prisma.procedureMaterialKit.findMany({
    where: { tenantId, procedureId },
    include: { product: true },
  });
  return items.map((item) => ({
    id: item.id,
    procedureId: item.procedureId,
    productId: item.productId,
    productName: item.product.name,
    productSku: item.product.sku,
    quantity: item.quantity,
    unit: item.product.unit,
  }));
}

export async function setProcedureKitItem(input: {
  tenantId: string;
  procedureId: string;
  productId: string;
  quantity: number;
  createdBy: string;
}) {
  if (input.quantity <= 0) return { error: "Quantidade deve ser maior que zero" as const };

  const prisma = await getPrisma();
  const procedure = await prisma.procedure.findFirst({
    where: { id: input.procedureId, tenantId: input.tenantId },
  });
  const product = await prisma.medicalProduct.findFirst({
    where: { id: input.productId, tenantId: input.tenantId, active: true },
  });
  if (!procedure || !product) return { error: "Procedimento ou produto não encontrado" as const };

  const item = await prisma.procedureMaterialKit.upsert({
    where: {
      procedureId_productId: {
        procedureId: input.procedureId,
        productId: input.productId,
      },
    },
    create: {
      tenantId: input.tenantId,
      procedureId: input.procedureId,
      productId: input.productId,
      quantity: input.quantity,
    },
    update: { quantity: input.quantity },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.PROCEDURE,
    entityId: input.procedureId,
    action: TIMELINE_ACTIONS.UPDATED,
    description: `Kit de materiais: ${product.name} (${input.quantity} ${product.unit}) vinculado ao procedimento ${procedure.code}`,
    createdBy: input.createdBy,
  });

  return { item: { id: item.id, productId: item.productId, quantity: item.quantity } };
}

export async function refreshExpiredLots(tenantId: string) {
  const prisma = await getPrisma();
  const now = new Date();
  await prisma.stockLot.updateMany({
    where: {
      tenantId,
      expiryDate: { lt: now },
      status: "DISPONIVEL",
    },
    data: { status: "VENCIDO" },
  });
}

export async function updateLotStatus(input: {
  tenantId: string;
  lotId: string;
  status: string;
  updatedBy: string;
}) {
  if (!isStockLotStatus(input.status)) {
    return { error: "Status inválido" as const };
  }

  const prisma = await getPrisma();
  const lot = await prisma.stockLot.findFirst({
    where: { id: input.lotId, tenantId: input.tenantId },
    include: { product: true },
  });
  if (!lot) return { error: "Lote não encontrado" as const };

  const updated = await prisma.stockLot.update({
    where: { id: lot.id },
    data: { status: input.status as StockLotStatus },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.STOCK_LOT,
    entityId: lot.id,
    action: TIMELINE_ACTIONS.UPDATED,
    description: `Lote ${lot.lotNumber} (${lot.product.name}) → ${input.status}`,
    createdBy: input.updatedBy,
  });

  return { lot: { id: updated.id, status: updated.status } };
}
