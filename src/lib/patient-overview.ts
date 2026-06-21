import "server-only";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import { getPatientTimelineEvents, type TimelineEventView } from "@/lib/timeline";

const dateTime = (value: Date) =>
  value.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const dateOnly = (value: Date) =>
  value.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export type PatientOverviewData = {
  patient: {
    id: string;
    name: string;
    cpf: string;
    birthDate: string;
    birthDateLabel: string;
    phone: string | null;
    company: { id: string; name: string; cnpj: string } | null;
    createdAt: string;
    createdAtLabel: string;
  };
  summary: {
    totalAppointments: number;
    totalUsages: number;
    totalRecords: number;
    totalInvoiced: number;
    totalInvoicedLabel: string;
    pendingAmount: number;
    pendingAmountLabel: string;
  };
  appointments: {
    id: string;
    scheduledAt: string;
    scheduledAtLabel: string;
    status: string;
    modality: string;
    telemedicineUrl: string | null;
    reason: string | null;
    providerName: string;
    usagesCount: number;
  }[];
  usages: {
    id: string;
    procedure: string;
    category: string;
    priceCharged: number;
    priceLabel: string;
    billed: boolean;
    performedAt: string;
    performedAtLabel: string;
    appointmentId: string;
    appointmentDateLabel: string;
  }[];
  medicalRecords: {
    id: string;
    content: string;
    recordType: string;
    title: string | null;
    createdAt: string;
    createdAtLabel: string;
    providerName: string;
    appointmentDateLabel: string | null;
  }[];
  invoices: {
    id: string;
    total: number;
    totalLabel: string;
    status: string;
    createdAt: string;
    createdAtLabel: string;
    company: string | null;
    items: { id: string; description: string; amount: number; amountLabel: string }[];
  }[];
  timeline: TimelineEventView[];
};

/**
 * Consolida a visão Cliente 360° de um beneficiário sem duplicar dados.
 * Leitura única via Prisma com includes controlados e filtro por tenant.
 */
export async function getPatientOverview(
  patientId: string,
  tenantId: string,
): Promise<PatientOverviewData | null> {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, tenantId },
    include: {
      company: true,
      appointments: {
        include: {
          provider: { select: { name: true } },
          usages: { include: { procedure: true } },
        },
        orderBy: { scheduledAt: "desc" },
      },
      medicalRecords: {
        include: {
          provider: { select: { name: true } },
          appointment: { select: { scheduledAt: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        include: { items: true, company: true },
        orderBy: { createdAt: "desc" },
      },
      subscriptions: { select: { id: true } },
      messages: { select: { id: true } },
    },
  });

  if (!patient) return null;

  const appointments = patient.appointments.map((appointment) => ({
    id: appointment.id,
    scheduledAt: appointment.scheduledAt.toISOString(),
    scheduledAtLabel: dateTime(appointment.scheduledAt),
    status: appointment.status,
    modality: appointment.modality,
    telemedicineUrl: appointment.telemedicineUrl,
    reason: appointment.reason,
    providerName: appointment.provider.name,
    usagesCount: appointment.usages.length,
  }));

  const usages = patient.appointments
    .flatMap((appointment) =>
      appointment.usages.map((usage) => ({
        id: usage.id,
        procedure: usage.procedure.name,
        category: usage.procedure.category,
        priceCharged: usage.priceCharged,
        priceLabel: formatBRL(usage.priceCharged),
        billed: usage.billed,
        performedAt: usage.performedAt.toISOString(),
        performedAtLabel: dateTime(usage.performedAt),
        appointmentId: appointment.id,
        appointmentDateLabel: dateTime(appointment.scheduledAt),
        sortKey: usage.performedAt.getTime(),
      })),
    )
    .sort((a, b) => b.sortKey - a.sortKey)
    .map(({ sortKey, ...usage }) => {
      void sortKey;
      return usage;
    });

  const pendingAmount = usages
    .filter((usage) => !usage.billed)
    .reduce((sum, usage) => sum + usage.priceCharged, 0);

  const totalInvoiced = patient.invoices.reduce((sum, invoice) => sum + invoice.total, 0);

  const appointmentIds = patient.appointments.map((appointment) => appointment.id);
  const usageIds = patient.appointments.flatMap((appointment) =>
    appointment.usages.map((usage) => usage.id),
  );
  const recordIds = patient.medicalRecords.map((record) => record.id);
  const invoiceIds = patient.invoices.map((invoice) => invoice.id);
  const subscriptionIds = patient.subscriptions.map((sub) => sub.id);
  const messageIds = patient.messages.map((msg) => msg.id);

  const timeline = await getPatientTimelineEvents(patientId, tenantId, {
    appointmentIds,
    usageIds,
    recordIds,
    invoiceIds,
    subscriptionIds,
    messageIds,
  });

  return {
    patient: {
      id: patient.id,
      name: patient.name,
      cpf: patient.cpf,
      birthDate: patient.birthDate.toISOString(),
      birthDateLabel: dateOnly(patient.birthDate),
      phone: patient.phone,
      company: patient.company
        ? { id: patient.company.id, name: patient.company.name, cnpj: patient.company.cnpj }
        : null,
      createdAt: patient.createdAt.toISOString(),
      createdAtLabel: dateOnly(patient.createdAt),
    },
    summary: {
      totalAppointments: appointments.length,
      totalUsages: usages.length,
      totalRecords: patient.medicalRecords.length,
      totalInvoiced,
      totalInvoicedLabel: formatBRL(totalInvoiced),
      pendingAmount,
      pendingAmountLabel: formatBRL(pendingAmount),
    },
    appointments,
    usages,
    medicalRecords: patient.medicalRecords.map((record) => ({
      id: record.id,
      content: record.content,
      recordType: record.recordType,
      title: record.title,
      createdAt: record.createdAt.toISOString(),
      createdAtLabel: dateTime(record.createdAt),
      providerName: record.provider.name,
      appointmentDateLabel: record.appointment
        ? dateTime(record.appointment.scheduledAt)
        : null,
    })),
    invoices: patient.invoices.map((invoice) => ({
      id: invoice.id,
      total: invoice.total,
      totalLabel: formatBRL(invoice.total),
      status: invoice.status,
      createdAt: invoice.createdAt.toISOString(),
      createdAtLabel: dateTime(invoice.createdAt),
      company: invoice.company?.name ?? null,
      items: invoice.items.map((item) => ({
        id: item.id,
        description: item.description,
        amount: item.amount,
        amountLabel: formatBRL(item.amount),
      })),
    })),
    timeline,
  };
}
