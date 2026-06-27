/** Constantes dos módulos avançados de Engenharia Civil (pacotes 1–5). */

export const CASH_ENTRY_TYPES = [
  { value: "ENTRADA", label: "Entrada" },
  { value: "SAIDA", label: "Saída" },
] as const;

export const CASH_CATEGORIES = [
  { value: "CONTRATO", label: "Contrato / parcela" },
  { value: "MEDICAO", label: "Medição" },
  { value: "MATERIAL", label: "Material" },
  { value: "MAO_OBRA", label: "Mão de obra" },
  { value: "ADIANTAMENTO", label: "Adiantamento" },
  { value: "INDIRETA", label: "Indireta" },
  { value: "OUTRO", label: "Outro" },
] as const;

export const ALLOCATION_CONTRACT_TYPES = [
  { value: "FECHADO", label: "Valor fechado" },
  { value: "DIARIA", label: "Diária" },
] as const;

export const ALLOCATION_STATUSES = [
  { value: "ATIVO", label: "Ativo" },
  { value: "ENCERRADO", label: "Encerrado" },
  { value: "CANCELADO", label: "Cancelado" },
] as const;

export const PAYMENT_TYPES = [
  { value: "PAGAMENTO", label: "Pagamento" },
  { value: "ADIANTAMENTO", label: "Adiantamento" },
] as const;

export const ENVIRONMENT_TYPES = [
  { value: "RESIDENCIAL", label: "Residencial" },
  { value: "CORPORATIVO", label: "Corporativo" },
] as const;

export const PROJECT_TYPES = [
  { value: "RESIDENCIAL", label: "Residencial" },
  { value: "CORPORATIVO", label: "Corporativo" },
] as const;

export const PIPELINE_STATUSES = [
  { value: "LEAD", label: "Lead" },
  { value: "VISITA", label: "Visita técnica" },
  { value: "ORCAMENTO", label: "Orçamento" },
  { value: "PROPOSTA", label: "Proposta enviada" },
  { value: "NEGOCIACAO", label: "Negociação" },
  { value: "GANHO", label: "Ganho" },
  { value: "PERDIDO", label: "Perdido" },
] as const;

export const CONTRACT_STATUSES = [
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "ENVIADO", label: "Enviado" },
  { value: "ASSINADO", label: "Assinado" },
  { value: "CANCELADO", label: "Cancelado" },
] as const;

export const ADDENDUM_STATUSES = [
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "APROVADO", label: "Aprovado" },
  { value: "ASSINADO", label: "Assinado" },
  { value: "CANCELADO", label: "Cancelado" },
] as const;

export const INDIRECT_CATEGORIES = [
  { value: "ADMINISTRATIVO", label: "Administrativo" },
  { value: "FROTA", label: "Frota" },
  { value: "ALUGUEL", label: "Aluguel" },
  { value: "IMPOSTO", label: "Imposto" },
  { value: "OUTRO", label: "Outro" },
] as const;

export function labelOf<T extends { value: string; label: string }>(
  list: readonly T[],
  value: string,
): string {
  return list.find((i) => i.value === value)?.label ?? value;
}

export type BdiBreakdownInput = {
  administration: number;
  risk: number;
  profit: number;
  taxes: number;
  financial: number;
};

/** Soma dos percentuais BDI decompostos. */
export function sumBdiPercent(bdi: BdiBreakdownInput): number {
  return bdi.administration + bdi.risk + bdi.profit + bdi.taxes + bdi.financial;
}

/** Aplica BDI sobre subtotal (custo direto). */
export function applyBdi(subtotal: number, bdiPercent: number): number {
  return subtotal * (1 + bdiPercent / 100);
}

/** Simula margem necessária para cobrir indiretas dado faturamento previsto. */
export function simulateBdiCoverage(input: {
  directCost: number;
  indirectCosts: number;
  targetProfit: number;
}): { requiredBdiPercent: number; salePrice: number } {
  const base = input.directCost + input.indirectCosts + input.targetProfit;
  const requiredBdiPercent =
    input.directCost > 0 ? ((base - input.directCost) / input.directCost) * 100 : 0;
  return { requiredBdiPercent, salePrice: base };
}

/** Calcula áreas a partir de medidas (m). */
export function calculateAreas(length: number, width: number, height: number) {
  const floorArea = length * width;
  const wallArea = 2 * (length + width) * height;
  const ceilingArea = floorArea;
  return { floorArea, wallArea, ceilingArea };
}

/** Custo direto de item = mão de obra + material; preço = custo direto com margem embutida no unitPrice. */
export function lineItemDirectCost(laborCost: number, materialCost: number, quantity: number): number {
  return (laborCost + materialCost) * quantity;
}
