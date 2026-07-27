/** Constantes de estoque médico — seguras para Client Components. */

export const STOCK_PRODUCT_CATEGORIES = [
  "MEDICAMENTO",
  "MATERIAL",
  "OPME",
  "INSUMO",
  "SERVICO",
] as const;

export type StockProductCategory = (typeof STOCK_PRODUCT_CATEGORIES)[number];

/** UN/ML/CX/PC/FR = saúde; KIT/SC/M3 = multi-nicho (dental/obras). */
export const STOCK_UNITS = ["UN", "ML", "CX", "PC", "FR", "KIT", "SC", "M3"] as const;

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
  SERVICO: "Serviço / crédito",
};

/** Tipos que aceitam reversão compensatória automática (com lote). */
export const STOCK_REVERSIBLE_TYPES = [
  "ENTRADA",
  "SAIDA",
  "AJUSTE",
  "DISPENSACAO",
  "TRANSFERENCIA",
  "PERDA",
  "DEVOLUCAO",
] as const;

export function isStockReversibleType(type: string): boolean {
  return (STOCK_REVERSIBLE_TYPES as readonly string[]).includes(type);
}

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

/**
 * Lote sintético para produtos com `requiresLot=false`.
 * Mantém saldo/FIFO/reversão no modelo atual sem exigir rastreio ANVISA.
 */
export const STOCK_NO_LOT_NUMBER = "SEM-LOTE";

/** Validade longe o suficiente para o lote sintético não virar alerta/VENCIDO. */
export const STOCK_NO_LOT_EXPIRY_ISO = "2099-12-31T00:00:00.000Z";

export function isStockSyntheticLot(lotNumber: string | null | undefined): boolean {
  return (lotNumber ?? "").trim().toUpperCase() === STOCK_NO_LOT_NUMBER;
}

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
