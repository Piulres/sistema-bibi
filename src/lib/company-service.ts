import "server-only";
import { prisma } from "@/lib/db";
import { companyStatusLabel, isCompanyStatus } from "@/lib/company-crm";
import { recordTimelineEvent, TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline";

export { isCompanyStatus };

export type CompanyView = {
  id: string;
  name: string;
  cnpj: string;
  status: string;
  statusLabel: string;
  contractActive: boolean;
  patientsCount: number;
};

function mapCompany(c: {
  id: string;
  name: string;
  cnpj: string;
  status: string;
  contractActive: boolean;
  _count?: { patients: number };
}): CompanyView {
  return {
    id: c.id,
    name: c.name,
    cnpj: c.cnpj,
    status: c.status,
    statusLabel: companyStatusLabel(c.status),
    contractActive: c.contractActive,
    patientsCount: c._count?.patients ?? 0,
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

export async function createCompany(input: {
  tenantId: string;
  name: string;
  cnpj: string;
  status?: string;
  contractActive?: boolean;
  createdBy: string;
}) {
  const cnpj = input.cnpj.replace(/\D/g, "");
  const existing = await prisma.company.findUnique({ where: { cnpj } });
  if (existing) return { error: "CNPJ já cadastrado" as const };

  const company = await prisma.company.create({
    data: {
      tenantId: input.tenantId,
      name: input.name.trim(),
      cnpj,
      status: input.status ?? "ATIVO",
      contractActive: input.contractActive ?? true,
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

export async function updateCompany(input: {
  tenantId: string;
  companyId: string;
  name?: string;
  cnpj?: string;
  status?: string;
  contractActive?: boolean;
  createdBy: string;
}) {
  const existing = await prisma.company.findFirst({
    where: { id: input.companyId, tenantId: input.tenantId },
  });
  if (!existing) return null;

  if (input.cnpj) {
    const cnpj = input.cnpj.replace(/\D/g, "");
    const dup = await prisma.company.findFirst({
      where: { cnpj, NOT: { id: existing.id } },
    });
    if (dup) return { error: "CNPJ já cadastrado" as const };
  }

  const company = await prisma.company.update({
    where: { id: existing.id },
    data: {
      name: input.name?.trim(),
      cnpj: input.cnpj ? input.cnpj.replace(/\D/g, "") : undefined,
      status: input.status,
      contractActive: input.contractActive,
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
