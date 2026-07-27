import "server-only";
import {
  buildInterchangeDataset,
  parseInterchangeContent,
  serializeInterchangeDataset,
  type InterchangeColumn,
} from "@/lib/imports/interchange";
import type { InterchangeFormat } from "@/lib/imports/format";
import { createPjBeneficiary } from "@/lib/pj-beneficiary-service";
import { getPrisma } from "@/lib/db";
import { isValidCpf, normalizeCpf } from "@/lib/validation/br-documents";

export const PJ_BENEFICIARY_IMPORT_ENTITY = "pj-beneficiaries";

export const PJ_BENEFICIARY_IMPORT_COLUMNS: InterchangeColumn[] = [
  { key: "name", header: "nome" },
  { key: "cpf", header: "cpf" },
  { key: "birthDate", header: "data_nascimento" },
  { key: "phone", header: "telefone" },
  { key: "email", header: "email" },
  { key: "gender", header: "genero" },
  { key: "motherName", header: "nome_mae" },
  { key: "employeeId", header: "matricula" },
  { key: "bondType", header: "vinculo" },
];

const TEMPLATE_ROW: Record<string, string> = {
  name: "Maria Silva",
  cpf: "529.982.247-25",
  birthDate: "1990-05-15",
  phone: "(11) 98765-4321",
  email: "maria@email.com",
  gender: "F",
  motherName: "Ana Silva",
  employeeId: "EMP-001",
  bondType: "TITULAR",
};

export type PjBeneficiaryImportRowResult = {
  row: number;
  status: "created" | "skipped" | "error";
  message: string;
  identifier?: string;
};

export type PjBeneficiaryImportBatchResult = {
  entity: typeof PJ_BENEFICIARY_IMPORT_ENTITY;
  format: InterchangeFormat;
  dryRun: boolean;
  total: number;
  created: number;
  skipped: number;
  errors: number;
  rows: PjBeneficiaryImportRowResult[];
};

function parseBirthDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(`${trimmed}T12:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    const date = new Date(`${year}-${month}-${day}T12:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

function trimOrNull(value: string | undefined): string | null {
  const v = (value ?? "").trim();
  return v || null;
}

export function buildPjBeneficiaryImportTemplate(format: InterchangeFormat): string {
  const dataset = buildInterchangeDataset({
    entity: PJ_BENEFICIARY_IMPORT_ENTITY,
    columns: PJ_BENEFICIARY_IMPORT_COLUMNS,
    rows: [TEMPLATE_ROW],
  });
  return serializeInterchangeDataset(dataset, format);
}

export function parsePjBeneficiaryImportContent(content: string, format: InterchangeFormat) {
  return parseInterchangeContent(
    content,
    format,
    PJ_BENEFICIARY_IMPORT_ENTITY,
    PJ_BENEFICIARY_IMPORT_COLUMNS,
  );
}

async function importRow(input: {
  tenantId: string;
  companyId: string;
  userId: string;
  rowNumber: number;
  row: Record<string, string>;
  dryRun: boolean;
}): Promise<PjBeneficiaryImportRowResult> {
  const name = input.row.name?.trim();
  const cpfRaw = input.row.cpf?.trim();
  const birthDateRaw = input.row.birthDate?.trim();

  if (!name || !cpfRaw || !birthDateRaw) {
    return {
      row: input.rowNumber,
      status: "error",
      message: "Nome, CPF e data de nascimento são obrigatórios",
    };
  }

  const cpf = normalizeCpf(cpfRaw);
  if (!isValidCpf(cpf)) {
    return {
      row: input.rowNumber,
      status: "error",
      message: "CPF inválido",
      identifier: cpfRaw,
    };
  }

  const birthDate = parseBirthDate(birthDateRaw);
  if (!birthDate) {
    return {
      row: input.rowNumber,
      status: "error",
      message: "Data de nascimento inválida",
      identifier: cpf,
    };
  }

  const prisma = await getPrisma();
  const existing = await prisma.patient.findUnique({ where: { cpf } });
  if (existing) {
    if (existing.companyId === input.companyId) {
      return {
        row: input.rowNumber,
        status: "skipped",
        message: "Colaborador já vinculado à empresa",
        identifier: cpf,
      };
    }
    if (existing.companyId) {
      return {
        row: input.rowNumber,
        status: "error",
        message: "CPF já vinculado a outra empresa",
        identifier: cpf,
      };
    }
  }

  if (input.dryRun) {
    return {
      row: input.rowNumber,
      status: "created",
      message: "Validado (simulação)",
      identifier: cpf,
    };
  }

  const result = await createPjBeneficiary({
    tenantId: input.tenantId,
    companyId: input.companyId,
    createdBy: input.userId,
    data: {
      name,
      cpf,
      birthDate,
      phone: trimOrNull(input.row.phone),
      email: trimOrNull(input.row.email),
      gender: trimOrNull(input.row.gender),
      motherName: trimOrNull(input.row.motherName),
      employeeId: trimOrNull(input.row.employeeId),
      bondType: trimOrNull(input.row.bondType),
    },
  });

  if ("error" in result) {
    return {
      row: input.rowNumber,
      status: "error",
      message: result.error ?? "Erro ao importar",
      identifier: cpf,
    };
  }

  return {
    row: input.rowNumber,
    status: "created",
    message: `Colaborador ${result.patient.name} importado`,
    identifier: cpf,
  };
}

export async function runPjBeneficiaryImportBatch(input: {
  tenantId: string;
  companyId: string;
  userId: string;
  content: string;
  format: InterchangeFormat;
  dryRun: boolean;
}): Promise<PjBeneficiaryImportBatchResult | { error: string }> {
  const parsed = parsePjBeneficiaryImportContent(input.content, input.format);
  if (!parsed.ok) return { error: parsed.error };

  const rows: PjBeneficiaryImportRowResult[] = [];
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (let index = 0; index < parsed.dataset.rows.length; index += 1) {
    const rowNumber = index + 1;
    const result = await importRow({
      tenantId: input.tenantId,
      companyId: input.companyId,
      userId: input.userId,
      rowNumber,
      row: parsed.dataset.rows[index]!,
      dryRun: input.dryRun,
    });
    rows.push(result);
    if (result.status === "created") created += 1;
    if (result.status === "skipped") skipped += 1;
    if (result.status === "error") errors += 1;
  }

  return {
    entity: PJ_BENEFICIARY_IMPORT_ENTITY,
    format: input.format,
    dryRun: input.dryRun,
    total: parsed.dataset.rows.length,
    created,
    skipped,
    errors,
    rows,
  };
}
