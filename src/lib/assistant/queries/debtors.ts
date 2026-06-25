import "server-only";
import { getPrisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";

export type DebtorEntry = {
  patientId: string;
  patientName: string;
  kind: "fatura_aberta" | "pay_per_use";
  amount: number;
  amountLabel: string;
  detail: string;
};

export async function listDebtors(tenantId: string, limit = 10): Promise<DebtorEntry[]> {
  const prisma = await getPrisma();
  const [openInvoices, pendingUsages] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: ["ABERTA", "FECHADA"] },
      },
      include: { patient: { select: { id: true, name: true } } },
      orderBy: { total: "desc" },
      take: limit * 2,
    }),
    prisma.procedureUsage.findMany({
      where: { billed: false, appointment: { tenantId } },
      include: {
        procedure: { select: { name: true } },
        appointment: { include: { patient: { select: { id: true, name: true } } } },
      },
    }),
  ]);

  const entries: DebtorEntry[] = [];

  for (const inv of openInvoices) {
    entries.push({
      patientId: inv.patientId,
      patientName: inv.patient.name,
      kind: "fatura_aberta",
      amount: inv.total,
      amountLabel: formatBRL(inv.total),
      detail: `Fatura ${inv.status.toLowerCase()}`,
    });
  }

  const usageGroups = new Map<string, { patientId: string; patientName: string; total: number; items: number }>();
  for (const usage of pendingUsages) {
    const patient = usage.appointment.patient;
    const group = usageGroups.get(patient.id) ?? {
      patientId: patient.id,
      patientName: patient.name,
      total: 0,
      items: 0,
    };
    group.total += usage.priceCharged;
    group.items += 1;
    usageGroups.set(patient.id, group);
  }

  for (const group of usageGroups.values()) {
    entries.push({
      patientId: group.patientId,
      patientName: group.patientName,
      kind: "pay_per_use",
      amount: group.total,
      amountLabel: formatBRL(group.total),
      detail: `${group.items} procedimento(s) não faturado(s)`,
    });
  }

  return entries.sort((a, b) => b.amount - a.amount).slice(0, limit);
}
