/** Categorias de despesa operacional da clínica (piloto CEDIG / MEDICAL). */
export const CLINIC_EXPENSE_CATEGORIES = [
  { id: "LABORATORIO", label: "Laboratório de biópsias" },
  { id: "ANESTESISTA", label: "Anestesista" },
  {
    id: "PESSOAL",
    label: "Pagamento de equipe (médicos, Alana, João Marcos, Márcia…)",
  },
  { id: "INSUMOS", label: "Insumos e materiais" },
  { id: "MEDICAMENTOS", label: "Medicamentos" },
  { id: "TAXA_CARTAO", label: "Taxas de cartão" },
  { id: "OUTRAS", label: "Outras despesas" },
] as const;

export {
  CEDIG_PRICE_TABLES,
  CEDIG_POLYPECTOMY_TIERS,
  cedigPriceTableLabel,
  cedigPolypectomyTierLabel,
  suggestCedigAmount,
  getCedigExamBasePrice,
  type CedigPriceTableId,
  type CedigPolypectomyTierId,
} from "@/lib/clinic-finance/cedig-pricing";

export type ClinicExpenseCategoryId =
  (typeof CLINIC_EXPENSE_CATEGORIES)[number]["id"];

export const CLINIC_PAYMENT_METHODS = [
  { id: "DINHEIRO", label: "Dinheiro" },
  { id: "PIX", label: "PIX" },
  { id: "CARTAO", label: "Cartão" },
  { id: "CONVENIO", label: "Convênio" },
  { id: "TRANSFERENCIA", label: "Transferência" },
  { id: "OUTRO", label: "Outro" },
] as const;

export type ClinicPaymentMethodId =
  (typeof CLINIC_PAYMENT_METHODS)[number]["id"];

export function clinicExpenseCategoryLabel(id: string): string {
  return CLINIC_EXPENSE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function clinicPaymentMethodLabel(id: string): string {
  return CLINIC_PAYMENT_METHODS.find((c) => c.id === id)?.label ?? id;
}
