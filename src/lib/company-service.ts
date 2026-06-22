import "server-only";
import { prisma } from "@/lib/db";
import { companyStatusLabel, isCompanyStatus } from "@/lib/company-crm";
import { recordTimelineEvent, TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline";
import { isValidCnpj, normalizeCnpj } from "@/lib/validation/br-documents";

export { isCompanyStatus };

export type CompanyFields = {
  tradeName?: string | null;
  email?: string | null;
  phone?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZip?: string | null;
};

export type CompanyView = {
  id: string;
  name: string;
  cnpj: string;
  tradeName: string | null;
  email: string | null;
  phone: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZip: string | null;
  status: string;
  statusLabel: string;
  contractActive: boolean;
  patientsCount: number;
};

function trimOrNull(value: string | null | undefined): string | null {
  const v = value?.trim();
  return v || null;
}

function mapCompany(c: {
  id: string;
  name: string;
  cnpj: string;
  tradeName: string | null;
  email: string | null;
  phone: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZip: string | null;
  status: string;
  contractActive: boolean;
  _count?: { patients: number };
}): CompanyView {
  return {
    id: c.id,
    name: c.name,
    cnpj: c.cnpj,
    tradeName: c.tradeName,
    email: c.email,
    phone: c.phone,
    contactName: c.contactName,
    contactEmail: c.contactEmail,
    contactPhone: c.contactPhone,
    addressStreet: c.addressStreet,
    addressCity: c.addressCity,
    addressState: c.addressState,
    addressZip: c.addressZip,
    status: c.status,
    statusLabel: companyStatusLabel(c.status),
    contractActive: c.contractActive,
    patientsCount: c._count?.patients ?? 0,
  };
}

function companyDataFromInput(fields: CompanyFields) {
  return {
    tradeName: fields.tradeName === undefined ? undefined : trimOrNull(fields.tradeName),
    email: fields.email === undefined ? undefined : trimOrNull(fields.email),
    phone: fields.phone === undefined ? undefined : trimOrNull(fields.phone),
    contactName: fields.contactName === undefined ? undefined : trimOrNull(fields.contactName),
    contactEmail: fields.contactEmail === undefined ? undefined : trimOrNull(fields.contactEmail),
    contactPhone: fields.contactPhone === undefined ? undefined : trimOrNull(fields.contactPhone),
    addressStreet: fields.addressStreet === undefined ? undefined : trimOrNull(fields.addressStreet),
    addressCity: fields.addressCity === undefined ? undefined : trimOrNull(fields.addressCity),
    addressState: fields.addressState === undefined ? undefined : trimOrNull(fields.addressState)?.toUpperCase(),
    addressZip: fields.addressZip === undefined ? undefined : trimOrNull(fields.addressZip),
  };
}

export async function listCompanies(tenantId: string): Promise<CompanyView[]> {
  const rows = await prisma.company.findMany({
    where: { tenantId },
    include: { _count: { select: { patients: true } } },
    orderBy: { name: "asc" },
  });
  return rows.map(mapCompany);
}

export async function createCompany(
  input: {
    tenantId: string;
    name: string;
    cnpj: string;
    status?: string;
    contractActive?: boolean;
    createdBy: string;
  } & CompanyFields,
) {
  const cnpj = normalizeCnpj(input.cnpj);
  if (!isValidCnpj(cnpj)) return { error: "CNPJ inválido" as const };

  const existing = await prisma.company.findUnique({ where: { cnpj } });
  if (existing) return { error: "CNPJ já cadastrado" as const };

  const company = await prisma.company.create({
    data: {
      tenantId: input.tenantId,
      name: input.name.trim(),
      cnpj,
      status: input.status ?? "ATIVO",
      contractActive: input.contractActive ?? true,
      ...companyDataFromInput(input),
    },
    include: { _count: { select: { patients: true } } },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.COMPANY,
    entityId: company.id,
    action: TIMELINE_ACTIONS.CREATED,
    description: `Empresa ${company.name} cadastrada`,
    createdBy: input.createdBy,
  });

  return { company: mapCompany(company) };
}

export async function updateCompany(
  input: {
    tenantId: string;
    companyId: string;
    name?: string;
    cnpj?: string;
    status?: string;
    contractActive?: boolean;
    createdBy: string;
  } & CompanyFields,
) {
  const existing = await prisma.company.findFirst({
    where: { id: input.companyId, tenantId: input.tenantId },
  });
  if (!existing) return null;

  if (input.cnpj) {
    const cnpj = normalizeCnpj(input.cnpj);
    if (!isValidCnpj(cnpj)) return { error: "CNPJ inválido" as const };
    const dup = await prisma.company.findFirst({
      where: { cnpj, NOT: { id: existing.id } },
    });
    if (dup) return { error: "CNPJ já cadastrado" as const };
  }

  const company = await prisma.company.update({
    where: { id: existing.id },
    data: {
      name: input.name?.trim(),
      cnpj: input.cnpj ? normalizeCnpj(input.cnpj) : undefined,
      status: input.status,
      contractActive: input.contractActive,
      ...companyDataFromInput(input),
    },
    include: { _count: { select: { patients: true } } },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.COMPANY,
    entityId: company.id,
    action: TIMELINE_ACTIONS.UPDATED,
    description: `Empresa ${company.name} atualizada`,
    createdBy: input.createdBy,
  });

  return { company: mapCompany(company) };
}
