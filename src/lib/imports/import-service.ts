import "server-only";
import { createCompany, listCompanies } from "@/lib/company-service";
import {
  buildInterchangeDataset,
  parseInterchangeContent,
  serializeInterchangeDataset,
  type InterchangeDataset,
} from "@/lib/imports/interchange";
import type { InterchangeFormat } from "@/lib/imports/format";
import {
  buildTemplateExampleRow,
  getImportColumns,
  getImportEntityLabel,
  type ImportEntity,
} from "@/lib/imports/schemas";
import { createPatient, listPatients } from "@/lib/patient-service";
import { createProcedure, listProcedures } from "@/lib/procedure-service";
import { getPrisma } from "@/lib/db";
import { isValidCnpj, isValidCpf, normalizeCnpj, normalizeCpf } from "@/lib/validation/br-documents";
import { recordTimelineEvent, TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline";

export type ImportRowResult = {
  row: number;
  status: "created" | "skipped" | "error";
  message: string;
  identifier?: string;
};

export type ImportBatchResult = {
  entity: ImportEntity;
  entityLabel: string;
  format: InterchangeFormat;
  dryRun: boolean;
  total: number;
  created: number;
  skipped: number;
  errors: number;
  rows: ImportRowResult[];
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

function parsePrice(value: string): number | null {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const num = Number(normalized);
  return Number.isFinite(num) && num >= 0 ? num : null;
}

function trimOrNull(value: string): string | null {
  const v = value.trim();
  return v || null;
}

async function resolveCompanyId(
  tenantId: string,
  companyCnpj: string,
): Promise<{ companyId: string | null; error?: string }> {
  const cnpj = normalizeCnpj(companyCnpj);
  if (!cnpj) return { companyId: null };
  if (!isValidCnpj(cnpj)) return { companyId: null, error: "CNPJ da empresa inválido" };
  const prisma = await getPrisma();
  const company = await prisma.company.findFirst({
    where: { tenantId, cnpj },
    select: { id: true },
  });
  if (!company) {
    return { companyId: null, error: `Empresa com CNPJ ${companyCnpj} não encontrada` };
  }
  return { companyId: company.id };
}

export function parseImportPayload(input: {
  entity: ImportEntity;
  content: string;
  format: InterchangeFormat;
}) {
  return parseInterchangeContent(
    input.content,
    input.format,
    input.entity,
    getImportColumns(input.entity),
  );
}

export function buildImportTemplate(entity: ImportEntity, format: InterchangeFormat): string {
  const dataset = buildInterchangeDataset({
    entity,
    columns: getImportColumns(entity),
    rows: [buildTemplateExampleRow(entity)],
  });
  return serializeInterchangeDataset(dataset, format);
}

export async function buildImportExportDataset(
  tenantId: string,
  entity: ImportEntity,
): Promise<InterchangeDataset> {
  if (entity === "patients") {
    const patients = await listPatients(tenantId);
    const prisma = await getPrisma();
    const companyCnpjById = new Map(
      (
        await prisma.company.findMany({
          where: { tenantId },
          select: { id: true, cnpj: true },
        })
      ).map((company) => [company.id, company.cnpj]),
    );

    return buildInterchangeDataset({
      entity,
      columns: getImportColumns(entity),
      rows: patients.map((patient) => ({
        name: patient.name,
        cpf: patient.cpf,
        birthDate: patient.birthDate,
        phone: patient.phone,
        email: patient.email,
        gender: patient.gender,
        motherName: patient.motherName,
        employeeId: patient.employeeId,
        bondType: patient.bondType,
        companyCnpj: patient.companyId ? companyCnpjById.get(patient.companyId) ?? "" : "",
      })),
    });
  }

  if (entity === "companies") {
    const companies = await listCompanies(tenantId);
    return buildInterchangeDataset({
      entity,
      columns: getImportColumns(entity),
      rows: companies.map((company) => ({
        name: company.name,
        cnpj: company.cnpj,
        tradeName: company.tradeName,
        email: company.email,
        phone: company.phone,
        contactName: company.contactName,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        status: company.status,
        addressStreet: company.addressStreet,
        addressCity: company.addressCity,
        addressState: company.addressState,
        addressZip: company.addressZip,
      })),
    });
  }

  const procedures = await listProcedures(tenantId);
  const prisma = await getPrisma();
  const full = await prisma.procedure.findMany({
    where: { tenantId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  const byId = new Map(full.map((procedure) => [procedure.id, procedure]));

  return buildInterchangeDataset({
    entity,
    columns: getImportColumns(entity),
    rows: procedures.map((procedure) => {
      const row = byId.get(procedure.id);
      return {
        code: procedure.code,
        name: procedure.name,
        category: procedure.category,
        basePrice: String(procedure.basePrice),
        serviceType: row?.serviceType ?? "",
        tissCode: row?.tissCode ?? "",
      };
    }),
  });
}

export async function serializeImportExport(
  tenantId: string,
  entity: ImportEntity,
  format: InterchangeFormat,
): Promise<string> {
  const dataset = await buildImportExportDataset(tenantId, entity);
  return serializeInterchangeDataset(dataset, format);
}

async function importPatientRow(input: {
  tenantId: string;
  userId: string;
  row: Record<string, string>;
  dryRun: boolean;
}): Promise<ImportRowResult> {
  const name = input.row.name?.trim();
  const cpfRaw = input.row.cpf?.trim();
  const birthDateRaw = input.row.birthDate?.trim();

  if (!name || !cpfRaw || !birthDateRaw) {
    return { row: 0, status: "error", message: "Nome, CPF e data de nascimento são obrigatórios" };
  }

  const cpf = normalizeCpf(cpfRaw);
  if (!isValidCpf(cpf)) {
    return { row: 0, status: "error", message: "CPF inválido", identifier: cpfRaw };
  }

  const birthDate = parseBirthDate(birthDateRaw);
  if (!birthDate) {
    return { row: 0, status: "error", message: "Data de nascimento inválida", identifier: cpf };
  }

  const prisma = await getPrisma();
  const existing = await prisma.patient.findUnique({ where: { cpf } });
  if (existing) {
    return { row: 0, status: "skipped", message: "CPF já cadastrado", identifier: cpf };
  }

  let companyId: string | null = null;
  const companyCnpj = input.row.companyCnpj?.trim();
  if (companyCnpj) {
    const resolved = await resolveCompanyId(input.tenantId, companyCnpj);
    if (resolved.error) {
      return { row: 0, status: "error", message: resolved.error, identifier: cpf };
    }
    companyId = resolved.companyId;
  }

  if (input.dryRun) {
    return { row: 0, status: "created", message: "Validado (simulação)", identifier: cpf };
  }

  const result = await createPatient({
    tenantId: input.tenantId,
    name,
    cpf,
    birthDate,
    phone: trimOrNull(input.row.phone ?? ""),
    email: trimOrNull(input.row.email ?? ""),
    gender: trimOrNull(input.row.gender ?? ""),
    motherName: trimOrNull(input.row.motherName ?? ""),
    employeeId: trimOrNull(input.row.employeeId ?? ""),
    bondType: trimOrNull(input.row.bondType ?? ""),
    companyId,
    createdBy: input.userId,
  });

  if ("error" in result) {
    return { row: 0, status: "error", message: result.error, identifier: cpf };
  }

  return {
    row: 0,
    status: "created",
    message: `Beneficiário ${result.patient.name} importado`,
    identifier: cpf,
  };
}

async function importCompanyRow(input: {
  tenantId: string;
  userId: string;
  row: Record<string, string>;
  dryRun: boolean;
}): Promise<ImportRowResult> {
  const name = input.row.name?.trim();
  const cnpjRaw = input.row.cnpj?.trim();
  if (!name || !cnpjRaw) {
    return { row: 0, status: "error", message: "Razão social e CNPJ são obrigatórios" };
  }

  const cnpj = normalizeCnpj(cnpjRaw);
  if (!isValidCnpj(cnpj)) {
    return { row: 0, status: "error", message: "CNPJ inválido", identifier: cnpjRaw };
  }

  const prisma = await getPrisma();
  const existing = await prisma.company.findUnique({ where: { cnpj } });
  if (existing) {
    return { row: 0, status: "skipped", message: "CNPJ já cadastrado", identifier: cnpj };
  }

  if (input.dryRun) {
    return { row: 0, status: "created", message: "Validado (simulação)", identifier: cnpj };
  }

  const result = await createCompany({
    tenantId: input.tenantId,
    name,
    cnpj,
    status: trimOrNull(input.row.status ?? "") ?? "ATIVO",
    tradeName: trimOrNull(input.row.tradeName ?? ""),
    email: trimOrNull(input.row.email ?? ""),
    phone: trimOrNull(input.row.phone ?? ""),
    contactName: trimOrNull(input.row.contactName ?? ""),
    contactEmail: trimOrNull(input.row.contactEmail ?? ""),
    contactPhone: trimOrNull(input.row.contactPhone ?? ""),
    addressStreet: trimOrNull(input.row.addressStreet ?? ""),
    addressCity: trimOrNull(input.row.addressCity ?? ""),
    addressState: trimOrNull(input.row.addressState ?? ""),
    addressZip: trimOrNull(input.row.addressZip ?? ""),
    createdBy: input.userId,
  });

  if ("error" in result) {
    return { row: 0, status: "error", message: result.error, identifier: cnpj };
  }

  return {
    row: 0,
    status: "created",
    message: `Empresa ${result.company.name} importada`,
    identifier: cnpj,
  };
}

async function importProcedureRow(input: {
  tenantId: string;
  userId: string;
  row: Record<string, string>;
  dryRun: boolean;
}): Promise<ImportRowResult> {
  const code = input.row.code?.trim();
  const name = input.row.name?.trim();
  const category = input.row.category?.trim();
  const basePrice = parsePrice(input.row.basePrice ?? "");

  if (!code || !name || !category || basePrice === null) {
    return {
      row: 0,
      status: "error",
      message: "Código, nome, categoria e preço base são obrigatórios",
      identifier: code,
    };
  }

  const prisma = await getPrisma();
  const existing = await prisma.procedure.findFirst({
    where: { tenantId: input.tenantId, code },
  });
  if (existing) {
    return { row: 0, status: "skipped", message: "Código já cadastrado", identifier: code };
  }

  if (input.dryRun) {
    return { row: 0, status: "created", message: "Validado (simulação)", identifier: code };
  }

  const result = await createProcedure({
    tenantId: input.tenantId,
    code,
    name,
    category,
    basePrice,
    createdBy: input.userId,
  });

  if ("error" in result) {
    return { row: 0, status: "error", message: result.error, identifier: code };
  }

  const serviceType = trimOrNull(input.row.serviceType ?? "");
  const tissCode = trimOrNull(input.row.tissCode ?? "");
  if (serviceType || tissCode) {
    await prisma.procedure.update({
      where: { id: result.procedure.id },
      data: {
        serviceType: serviceType ?? undefined,
        tissCode: tissCode ?? undefined,
      },
    });
  }

  return {
    row: 0,
    status: "created",
    message: `Procedimento ${result.procedure.code} importado`,
    identifier: code,
  };
}

export async function runImportBatch(input: {
  tenantId: string;
  userId: string;
  entity: ImportEntity;
  format: InterchangeFormat;
  content: string;
  dryRun?: boolean;
}): Promise<ImportBatchResult | { error: string }> {
  const parsed = parseImportPayload({
    entity: input.entity,
    content: input.content,
    format: input.format,
  });

  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const dryRun = input.dryRun ?? false;
  const rowResults: ImportRowResult[] = [];

  for (let index = 0; index < parsed.dataset.rows.length; index += 1) {
    const row = parsed.dataset.rows[index];
    const rowNumber = index + 1;

    let result: ImportRowResult;
    if (input.entity === "patients") {
      result = await importPatientRow({
        tenantId: input.tenantId,
        userId: input.userId,
        row,
        dryRun,
      });
    } else if (input.entity === "companies") {
      result = await importCompanyRow({
        tenantId: input.tenantId,
        userId: input.userId,
        row,
        dryRun,
      });
    } else {
      result = await importProcedureRow({
        tenantId: input.tenantId,
        userId: input.userId,
        row,
        dryRun,
      });
    }

    rowResults.push({ ...result, row: rowNumber });
  }

  const created = rowResults.filter((row) => row.status === "created").length;
  const skipped = rowResults.filter((row) => row.status === "skipped").length;
  const errors = rowResults.filter((row) => row.status === "error").length;

  if (!dryRun && created > 0) {
    await recordTimelineEvent({
      tenantId: input.tenantId,
      entityType: TIMELINE_ENTITY_TYPES.SECURITY,
      entityId: input.entity,
      action: TIMELINE_ACTIONS.IMPORTED,
      description: `Importação ${getImportEntityLabel(input.entity)}: ${created} criado(s), ${skipped} ignorado(s), ${errors} erro(s)`,
      createdBy: input.userId,
    });
  }

  return {
    entity: input.entity,
    entityLabel: getImportEntityLabel(input.entity),
    format: input.format,
    dryRun,
    total: rowResults.length,
    created,
    skipped,
    errors,
    rows: rowResults,
  };
}
