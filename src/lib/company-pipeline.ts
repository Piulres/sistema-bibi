import "server-only";
import { prisma } from "@/lib/db";
import {
  COMPANY_STATUSES,
  companyStatusLabel,
  contractActiveFromStatus,
} from "@/lib/company-crm";

export type CompanyPipelineCard = {
  id: string;
  name: string;
  cnpj: string;
  status: string;
  statusLabel: string;
  contractActive: boolean;
  beneficiariesCount: number;
  invoicesCount: number;
  createdAt: string;
};

export type CompanyPipelineData = {
  statuses: { value: string; label: string }[];
  companies: CompanyPipelineCard[];
  pipeline: Record<string, CompanyPipelineCard[]>;
};

/** Lista empresas do tenant para o pipeline CRM. */
export async function getCompanyPipeline(tenantId: string): Promise<CompanyPipelineData> {
  const companies = await prisma.company.findMany({
    where: { tenantId },
    include: {
      _count: { select: { patients: true, invoices: true } },
    },
    orderBy: { name: "asc" },
  });

  const cards: CompanyPipelineCard[] = companies.map((company) => ({
    id: company.id,
    name: company.name,
    cnpj: company.cnpj,
    status: company.status,
    statusLabel: companyStatusLabel(company.status),
    contractActive: company.contractActive,
    beneficiariesCount: company._count.patients,
    invoicesCount: company._count.invoices,
    createdAt: company.createdAt.toISOString(),
  }));

  const pipeline = Object.fromEntries(
    COMPANY_STATUSES.map((status) => [
      status.value,
      cards.filter((company) => company.status === status.value),
    ]),
  ) as Record<string, CompanyPipelineCard[]>;

  return {
    statuses: COMPANY_STATUSES.map((s) => ({ value: s.value, label: s.label })),
    companies: cards,
    pipeline,
  };
}

export { contractActiveFromStatus };
