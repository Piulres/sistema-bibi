import {
  buildInterchangeDataset,
  serializeInterchangeDataset,
} from "@/lib/imports/interchange";
import type { InterchangeFormat } from "@/lib/imports/format";
import type { ImportEntity } from "@/lib/imports/schemas";
import { getImportColumns } from "@/lib/imports/schemas";

const unique = () => Date.now().toString().slice(-8);

export function generateValidCpf(): string {
  const seed = Date.now() % 1000000000;
  const nine = String(seed).padStart(9, "0");
  const nums = nine.split("").map(Number);
  const sum1 = nums.reduce((acc, d, i) => acc + d * (10 - i), 0);
  let d1 = (sum1 * 10) % 11;
  if (d1 === 10) d1 = 0;
  const sum2 = [...nums, d1].reduce((acc, d, i) => acc + d * (11 - i), 0);
  let d2 = (sum2 * 10) % 11;
  if (d2 === 10) d2 = 0;
  return nine + String(d1) + String(d2);
}

export function generateValidCnpj(): string {
  const base = String(Date.now() % 100000000000)
    .padStart(12, "0")
    .slice(-12)
    .split("")
    .map(Number);
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const mod = (nums: number[], weights: number[]) => {
    const sum = nums.reduce((acc, d, i) => acc + d * weights[i], 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = mod(base, w1);
  const d2 = mod([...base, d1], w2);
  return [...base, d1, d2].join("");
}

export function buildImportContent(
  entity: ImportEntity,
  rows: Record<string, string>[],
  format: InterchangeFormat,
): string {
  const dataset = buildInterchangeDataset({
    entity,
    columns: getImportColumns(entity),
    rows,
  });
  return serializeInterchangeDataset(dataset, format);
}

export function buildPatientImportRow(overrides: Partial<Record<string, string>> = {}) {
  const suffix = unique();
  return {
    name: `Import Paciente ${suffix}`,
    cpf: generateValidCpf(),
    birthDate: "1992-08-20",
    phone: "11999990000",
    email: `import.${suffix}@test.com`,
    gender: "F",
    motherName: "",
    employeeId: "",
    bondType: "TITULAR",
    companyCnpj: "",
    ...overrides,
  };
}

export function buildCompanyImportRow(overrides: Partial<Record<string, string>> = {}) {
  const suffix = unique();
  return {
    name: `Import Empresa ${suffix} Ltda`,
    cnpj: generateValidCnpj(),
    tradeName: `Import ${suffix}`,
    email: `empresa.${suffix}@test.com`,
    phone: "1133334444",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    status: "ATIVO",
    addressStreet: "",
    addressCity: "São Paulo",
    addressState: "SP",
    addressZip: "",
    ...overrides,
  };
}

export function buildProcedureImportRow(overrides: Partial<Record<string, string>> = {}) {
  const suffix = unique();
  return {
    code: `IMP-${suffix}`,
    name: `Procedimento import ${suffix}`,
    category: "CONSULTA",
    basePrice: "199.90",
    serviceType: "CLINICA",
    tissCode: "",
    ...overrides,
  };
}
