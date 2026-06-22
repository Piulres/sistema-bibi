/** Normaliza CPF/CNPJ para apenas dígitos. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeCpf(value: string): string {
  return digitsOnly(value).slice(0, 11);
}

export function normalizeCnpj(value: string): string {
  return digitsOnly(value).slice(0, 14);
}

function cpfChecksum(digits: number[], factor: number): number {
  const sum = digits.reduce((acc, d, i) => acc + d * (factor - i), 0);
  const mod = (sum * 10) % 11;
  return mod === 10 ? 0 : mod;
}

/** Valida CPF brasileiro (11 dígitos + dígitos verificadores). */
export function isValidCpf(value: string): boolean {
  const cpf = normalizeCpf(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  const nums = cpf.split("").map(Number);
  const d1 = cpfChecksum(nums.slice(0, 9), 10);
  const d2 = cpfChecksum(nums.slice(0, 10), 11);
  return d1 === nums[9] && d2 === nums[10];
}

/** Valida CNPJ brasileiro (14 dígitos + dígitos verificadores). */
export function isValidCnpj(value: string): boolean {
  const cnpj = normalizeCnpj(value);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;
  const calc = (length: number) => {
    const slice = cnpj.slice(0, length).split("").map(Number);
    const weights =
      length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = slice.reduce((acc, d, i) => acc + d * weights[i], 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  const d1 = calc(12);
  const d2 = calc(13);
  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13]);
}

export function formatCpf(value: string): string {
  const d = normalizeCpf(value);
  if (d.length !== 11) return value;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function formatCnpj(value: string): string {
  const d = normalizeCnpj(value);
  if (d.length !== 14) return value;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}
