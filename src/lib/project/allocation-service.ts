import "server-only";
import { getPrisma } from "@/lib/db";
import {
  labelOf,
  ALLOCATION_CONTRACT_TYPES,
  ALLOCATION_STATUSES,
  PAYMENT_TYPES,
} from "@/lib/project/construction-modules";

export type AllocationPaymentView = {
  id: string;
  amount: number;
  paymentType: string;
  paymentTypeLabel: string;
  paymentDate: string;
  notes: string | null;
  status: string;
};

export type AllocationView = {
  id: string;
  providerId: string;
  providerName: string;
  trade: string;
  contractType: string;
  contractTypeLabel: string;
  contractValue: number;
  dailyRate: number | null;
  status: string;
  statusLabel: string;
  notes: string | null;
  paidTotal: number;
  advanceTotal: number;
  remaining: number;
  payments: AllocationPaymentView[];
};

export async function listProjectAllocations(
  tenantId: string,
  projectId: string,
): Promise<AllocationView[]> {
  const prisma = await getPrisma();
  const rows = await prisma.projectAllocation.findMany({
    where: { tenantId, projectId },
    include: {
      provider: { select: { id: true, name: true } },
      payments: { orderBy: { paymentDate: "desc" } },
    },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(mapAllocation);
}

export async function upsertProjectAllocation(
  tenantId: string,
  projectId: string,
  input: {
    id?: string;
    providerId: string;
    trade: string;
    contractType: string;
    contractValue: number;
    dailyRate?: number | null;
    status?: string;
    notes?: string | null;
  },
): Promise<{ data: AllocationView } | { error: string }> {
  const prisma = await getPrisma();
  const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
  if (!project) return { error: "Obra não encontrada" };

  const provider = await prisma.user.findFirst({
    where: { id: input.providerId, tenantId, role: "PRESTADOR" },
  });
  if (!provider) return { error: "Prestador não encontrado" };

  const payload = {
    providerId: input.providerId,
    trade: input.trade,
    contractType: input.contractType,
    contractValue: input.contractValue,
    dailyRate: input.dailyRate ?? null,
    status: input.status ?? "ATIVO",
    notes: input.notes ?? null,
  };

  const row = input.id
    ? await prisma.projectAllocation.update({
        where: { id: input.id },
        data: payload,
        include: {
          provider: { select: { id: true, name: true } },
          payments: { orderBy: { paymentDate: "desc" } },
        },
      })
    : await prisma.projectAllocation.create({
        data: { ...payload, tenantId, projectId },
        include: {
          provider: { select: { id: true, name: true } },
          payments: { orderBy: { paymentDate: "desc" } },
        },
      });

  return { data: mapAllocation(row) };
}

export async function addAllocationPayment(
  tenantId: string,
  allocationId: string,
  input: {
    amount: number;
    paymentType: string;
    paymentDate: string;
    notes?: string | null;
  },
): Promise<{ data: AllocationView } | { error: string }> {
  const prisma = await getPrisma();
  const allocation = await prisma.projectAllocation.findFirst({
    where: { id: allocationId, tenantId },
  });
  if (!allocation) return { error: "Alocação não encontrada" };

  await prisma.projectAllocationPayment.create({
    data: {
      allocationId,
      amount: input.amount,
      paymentType: input.paymentType,
      paymentDate: new Date(input.paymentDate),
      notes: input.notes ?? null,
    },
  });

  const updated = await prisma.projectAllocation.findUniqueOrThrow({
    where: { id: allocationId },
    include: {
      provider: { select: { id: true, name: true } },
      payments: { orderBy: { paymentDate: "desc" } },
    },
  });

  return { data: mapAllocation(updated) };
}

function mapAllocation(row: {
  id: string;
  providerId: string;
  provider: { name: string };
  trade: string;
  contractType: string;
  contractValue: number;
  dailyRate: number | null;
  status: string;
  notes: string | null;
  payments: {
    id: string;
    amount: number;
    paymentType: string;
    paymentDate: Date;
    notes: string | null;
    status: string;
  }[];
}): AllocationView {
  let paidTotal = 0;
  let advanceTotal = 0;
  for (const p of row.payments) {
    if (p.paymentType === "ADIANTAMENTO") advanceTotal += p.amount;
    else paidTotal += p.amount;
  }
  const remaining = Math.max(0, row.contractValue - paidTotal - advanceTotal);

  return {
    id: row.id,
    providerId: row.providerId,
    providerName: row.provider.name,
    trade: row.trade,
    contractType: row.contractType,
    contractTypeLabel: labelOf(ALLOCATION_CONTRACT_TYPES, row.contractType),
    contractValue: row.contractValue,
    dailyRate: row.dailyRate,
    status: row.status,
    statusLabel: labelOf(ALLOCATION_STATUSES, row.status),
    notes: row.notes,
    paidTotal,
    advanceTotal,
    remaining,
    payments: row.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      paymentType: p.paymentType,
      paymentTypeLabel: labelOf(PAYMENT_TYPES, p.paymentType),
      paymentDate: p.paymentDate.toISOString(),
      notes: p.notes,
      status: p.status,
    })),
  };
}
