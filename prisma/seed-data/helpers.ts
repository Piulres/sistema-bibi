import type { CompanyStatus } from "../../src/lib/company-crm";
import { contractActiveFromStatus } from "../../src/lib/company-crm";

/** Formata 14 dígitos como CNPJ (XX.XXX.XXX/XXXX-XX). */
export function formatCnpj(digits: string): string {
  const d = digits.replace(/\D/g, "").padStart(14, "0").slice(-14);
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** Formata 11 dígitos como CPF (XXX.XXX.XXX-XX). */
export function formatCpf(digits: string): string {
  const d = digits.replace(/\D/g, "").padStart(11, "0").slice(-11);
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function cpfChecksum(digits: number[], factor: number): number {
  const sum = digits.reduce((acc, d, i) => acc + d * (factor - i), 0);
  const mod = (sum * 10) % 11;
  return mod === 10 ? 0 : mod;
}

/** Monta CPF válido a partir de 9 dígitos base (determinístico para seed). */
export function buildValidCpfFromBase(base9: string): string {
  const nums = base9
    .replace(/\D/g, "")
    .padStart(9, "0")
    .slice(-9)
    .split("")
    .map(Number);
  if (nums.every((d) => d === nums[0])) {
    nums[8] = (nums[8]! + 1) % 10;
  }
  const d1 = cpfChecksum(nums, 10);
  const d2 = cpfChecksum([...nums, d1], 11);
  return formatCpf([...nums, d1, d2].join(""));
}

/** Gera CNPJ determinístico (apenas para seed — não valida dígitos verificadores). */
export function seedCnpj(index: number): string {
  const base = String(10_000_000 + index).padStart(8, "0");
  return formatCnpj(`${base}0001${String(index % 100).padStart(2, "0")}`);
}

/** Gera CPF determinístico com dígitos verificadores válidos (apenas para seed). */
export function seedCpf(companyIndex: number, patientIndex: number): string {
  const base = String(100_000_000 + companyIndex * 1000 + patientIndex).padStart(9, "0");
  return buildValidCpfFromBase(base);
}

/** CPF demo memorável por índice (star flows, catálogos de nicho). */
export function demoCpf(seed: number): string {
  const base = String(200_000_000 + seed * 17_371).padStart(9, "0");
  return buildValidCpfFromBase(base);
}

export function slugFromName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
}

export function pjEmailFromCompany(name: string, index: number): string {
  const slug = slugFromName(name).replace(/-/g, "");
  return `rh.${slug.slice(0, 12)}${index}@empresa.demo`;
}

/** E-mail determinístico para equipe PJ (RH, financeiro, benefícios…). */
export function pjRoleEmail(
  name: string,
  companyIndex: number,
  roleSuffix: string,
): string {
  const slug = slugFromName(name).replace(/-/g, "");
  return `${roleSuffix}.${slug.slice(0, 10)}${companyIndex}@empresa.demo`;
}

export function beneficiaryEmail(name: string, index: number): string {
  const parts = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(" ");
  const first = parts[0] ?? "user";
  const last = parts[parts.length - 1] ?? "demo";
  return `${first}.${last}${index}@beneficiario.demo`;
}

export function phoneForIndex(index: number): string {
  const ddd = 11 + (index % 8);
  const num = String(9_0000_0000 + index * 13_371).slice(-8);
  return `(${ddd}) 9${num.slice(0, 4)}-${num.slice(4)}`;
}

export function birthDateForAge(age: number, salt: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  d.setMonth((salt + age) % 12);
  d.setDate(1 + (salt % 27));
  d.setHours(12, 0, 0, 0);
  return d;
}

export function pick<T>(arr: readonly T[], index: number): T {
  return arr[index % arr.length]!;
}

export function contractActiveForStatus(status: CompanyStatus): boolean {
  return contractActiveFromStatus(status);
}

/** Retorna uma data de hoje com a hora informada (horário local). */
export function todayAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** Primeiro dia do mês daqui a N meses. */
export function firstDayOfMonthFromNow(monthsAhead: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  d.setMonth(d.getMonth() + monthsAhead);
  return d;
}

/** Dias atrás a partir de hoje. */
export function daysAgo(days: number, hour = 10, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** Meses atrás (primeiro dia do mês). */
export function monthsAgo(months: number, day = 15, hour = 10): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setDate(day);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/** Dias à frente a partir de hoje. */
export function daysFromNow(days: number, hour = 10, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}
