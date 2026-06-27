import "server-only";
import { getPrisma } from "@/lib/db";
import {
  labelOf,
  CONTRACT_STATUSES,
  ADDENDUM_STATUSES,
} from "@/lib/project/construction-modules";

export type AddendumView = {
  id: string;
  addendumNumber: number;
  title: string;
  description: string | null;
  valueDelta: number;
  scheduleDeltaDays: number;
  status: string;
  statusLabel: string;
  signedAt: string | null;
};

export type ContractView = {
  id: string;
  contractNumber: string;
  title: string;
  totalValue: number;
  signedAt: string | null;
  status: string;
  statusLabel: string;
  notes: string | null;
  addendums: AddendumView[];
  consolidatedValue: number;
};

export async function listProjectContracts(
  tenantId: string,
  projectId: string,
): Promise<ContractView[]> {
  const prisma = await getPrisma();
  const rows = await prisma.projectContract.findMany({
    where: { tenantId, projectId },
    include: { addendums: { orderBy: { addendumNumber: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(mapContract);
}

export async function upsertProjectContract(
  tenantId: string,
  projectId: string,
  input: {
    id?: string;
    contractNumber: string;
    title: string;
    totalValue: number;
    status?: string;
    notes?: string | null;
    signedAt?: string | null;
  },
): Promise<{ data: ContractView } | { error: string }> {
  const prisma = await getPrisma();
  const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
  if (!project) return { error: "Obra não encontrada" };

  const payload = {
    contractNumber: input.contractNumber,
    title: input.title,
    totalValue: input.totalValue,
    status: input.status ?? "RASCUNHO",
    notes: input.notes ?? null,
    signedAt: input.signedAt ? new Date(input.signedAt) : null,
  };

  const row = input.id
    ? await prisma.projectContract.update({
        where: { id: input.id },
        data: payload,
        include: { addendums: { orderBy: { addendumNumber: "asc" } } },
      })
    : await prisma.projectContract.create({
        data: { ...payload, tenantId, projectId },
        include: { addendums: { orderBy: { addendumNumber: "asc" } } },
      });

  return { data: mapContract(row) };
}

export async function upsertContractAddendum(
  tenantId: string,
  contractId: string,
  input: {
    id?: string;
    addendumNumber: number;
    title: string;
    description?: string | null;
    valueDelta?: number;
    scheduleDeltaDays?: number;
    status?: string;
    signedAt?: string | null;
  },
): Promise<{ data: AddendumView } | { error: string }> {
  const prisma = await getPrisma();
  const contract = await prisma.projectContract.findFirst({
    where: { id: contractId, tenantId },
  });
  if (!contract) return { error: "Contrato não encontrado" };

  const payload = {
    addendumNumber: input.addendumNumber,
    title: input.title,
    description: input.description ?? null,
    valueDelta: input.valueDelta ?? 0,
    scheduleDeltaDays: input.scheduleDeltaDays ?? 0,
    status: input.status ?? "RASCUNHO",
    signedAt: input.signedAt ? new Date(input.signedAt) : null,
  };

  const row = input.id
    ? await prisma.contractAddendum.update({ where: { id: input.id }, data: payload })
    : await prisma.contractAddendum.create({ data: { ...payload, contractId } });

  return { data: mapAddendum(row) };
}

export async function listContractsForCompany(
  tenantId: string,
  companyId: string,
): Promise<ContractView[]> {
  const prisma = await getPrisma();
  const rows = await prisma.projectContract.findMany({
    where: { tenantId, project: { companyId } },
    include: { addendums: { orderBy: { addendumNumber: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapContract);
}

function mapAddendum(row: {
  id: string;
  addendumNumber: number;
  title: string;
  description: string | null;
  valueDelta: number;
  scheduleDeltaDays: number;
  status: string;
  signedAt: Date | null;
}): AddendumView {
  return {
    id: row.id,
    addendumNumber: row.addendumNumber,
    title: row.title,
    description: row.description,
    valueDelta: row.valueDelta,
    scheduleDeltaDays: row.scheduleDeltaDays,
    status: row.status,
    statusLabel: labelOf(ADDENDUM_STATUSES, row.status),
    signedAt: row.signedAt?.toISOString() ?? null,
  };
}

function mapContract(row: {
  id: string;
  contractNumber: string;
  title: string;
  totalValue: number;
  signedAt: Date | null;
  status: string;
  notes: string | null;
  addendums: {
    id: string;
    addendumNumber: number;
    title: string;
    description: string | null;
    valueDelta: number;
    scheduleDeltaDays: number;
    status: string;
    signedAt: Date | null;
  }[];
}): ContractView {
  const signedAddendumDelta = row.addendums
    .filter((a) => a.status === "ASSINADO" || a.status === "APROVADO")
    .reduce((sum, a) => sum + a.valueDelta, 0);

  return {
    id: row.id,
    contractNumber: row.contractNumber,
    title: row.title,
    totalValue: row.totalValue,
    signedAt: row.signedAt?.toISOString() ?? null,
    status: row.status,
    statusLabel: labelOf(CONTRACT_STATUSES, row.status),
    notes: row.notes,
    addendums: row.addendums.map(mapAddendum),
    consolidatedValue: row.totalValue + signedAddendumDelta,
  };
}
