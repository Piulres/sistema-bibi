import { isValidCpf } from "@/lib/validation/br-documents";
import type { CedigPriceTableId } from "@/lib/clinic-finance/cedig-pricing";

/** Mapa tabela CEDIG → razão social da Company no seed. */
export const CEDIG_PRICE_TABLE_COMPANY_NAME: Record<
  CedigPriceTableId,
  string | null
> = {
  PARTICULAR: null,
  CENTRALMED: "CentralMed",
  BEM_SAUDE: "Bem Saúde",
  DR_SAUDE: "Dr Saúde",
};

export function mapClinicPaymentToInvoiceMethod(paymentMethod: string): string {
  switch (paymentMethod) {
    case "PIX":
      return "PIX";
    case "CARTAO":
      return "CARTAO";
    case "DINHEIRO":
      return "DINHEIRO";
    case "TRANSFERENCIA":
      return "TRANSFERENCIA";
    case "CONVENIO":
      return "CONVENIO";
    default:
      return "MANUAL";
  }
}

function cpfCheckDigit(digits: number[], factor: number): number {
  const sum = digits.reduce((acc, d, i) => acc + d * (factor - i), 0);
  const mod = (sum * 10) % 11;
  return mod === 10 ? 0 : mod;
}

/** Gera CPF válido determinístico a partir de uma semente (paciente provisório). */
export function generateProvisionalCpf(seed: string): string {
  let n = 0;
  for (let i = 0; i < seed.length; i++) {
    n = (n * 33 + seed.charCodeAt(i)) >>> 0;
  }
  let base = String(100000000 + (n % 899999999)).padStart(9, "0").slice(0, 9);
  if (/^(\d)\1+$/.test(base)) {
    base = `8${base.slice(1)}`;
  }
  const nums = base.split("").map(Number);
  const d1 = cpfCheckDigit(nums, 10);
  const d2 = cpfCheckDigit([...nums, d1], 11);
  const cpf = `${base}${d1}${d2}`;
  return isValidCpf(cpf) ? cpf : "39053344705";
}
