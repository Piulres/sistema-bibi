/** Constantes de estoque médico — seguras para Client Components. */

export const STOCK_PRODUCT_CATEGORIES = [
  "MEDICAMENTO",
  "MATERIAL",
  "OPME",
  "INSUMO",
] as const;

export type StockProductCategory = (typeof STOCK_PRODUCT_CATEGORIES)[number];

export const STOCK_UNITS = ["UN", "ML", "CX", "PC", "FR"] as const;

export type StockUnit = (typeof STOCK_UNITS)[number];

export const STOCK_LOT_STATUSES = [
  "DISPONIVEL",
  "BLOQUEADO",
  "VENCIDO",
  "QUARENTENA",
] as const;

export type StockLotStatus = (typeof STOCK_LOT_STATUSES)[number];

/** Tipos de movimentação (direção inferida pelo tipo). */
export const STOCK_MOVEMENT_TYPES = [
  "ENTRADA",
  "SAIDA",
  "AJUSTE",
  "DISPENSACAO",
  "TRANSFERENCIA",
  "PERDA",
  "DEVOLUCAO",
] as const;

export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export const STOCK_CATEGORY_LABELS: Record<StockProductCategory, string> = {
  MEDICAMENTO: "Medicamento",
  MATERIAL: "Material médico",
  OPME: "OPME",
  INSUMO: "Insumo",
};

export const STOCK_MOVEMENT_LABELS: Record<StockMovementType, string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  AJUSTE: "Ajuste de inventário",
  DISPENSACAO: "Dispensação ao paciente",
  TRANSFERENCIA: "Transferência entre setores",
  PERDA: "Perda / avaria",
  DEVOLUCAO: "Devolução",
};

export const STOCK_LOT_STATUS_LABELS: Record<StockLotStatus, string> = {
  DISPONIVEL: "Disponível",
  BLOQUEADO: "Bloqueado",
  VENCIDO: "Vencido",
  QUARENTENA: "Quarentena",
};

/** Dias antes do vencimento para alerta preventivo. */
export const STOCK_EXPIRY_ALERT_DAYS = 90;

export function isStockProductCategory(value: string): value is StockProductCategory {
  return (STOCK_PRODUCT_CATEGORIES as readonly string[]).includes(value);
}

export function isStockUnit(value: string): value is StockUnit {
  return (STOCK_UNITS as readonly string[]).includes(value);
}

export function isStockMovementType(value: string): value is StockMovementType {
  return (STOCK_MOVEMENT_TYPES as readonly string[]).includes(value);
}

export function isStockLotStatus(value: string): value is StockLotStatus {
  return (STOCK_LOT_STATUSES as readonly string[]).includes(value);
}

/** Movimentos que reduzem saldo do lote. */
export function isStockOutbound(type: StockMovementType): boolean {
  return type === "SAIDA" || type === "DISPENSACAO" || type === "PERDA" || type === "TRANSFERENCIA";
}

/** Movimentos que aumentam saldo do lote. */
export function isStockInbound(type: StockMovementType): boolean {
  return type === "ENTRADA" || type === "DEVOLUCAO";
}
