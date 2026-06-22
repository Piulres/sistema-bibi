import "server-only";
import { getPrisma } from "@/lib/db";
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

export type ProviderPatientOverviewData = {
  patient: {
    id: string;
    name: string;
    cpf: string;
    birthDateLabel: string;
    phone: string | null;
    company: string | null;
  };
  summary: {
    totalAppointments: number;
    totalUsages: number;
    totalRecords: number;
    lastVisitLabel: string | null;
    nextVisitLabel: string | null;
  };
  appointments: {
    id: string;
    scheduledAt: string;
    scheduledAtLabel: string;
    status: string;
    modality: string;
    reason: string | null;
    usagesCount: number;
  }[];
  usages: {
    id: string;
    procedure: string;
    category: string;
    performedAtLabel: string;
    appointmentDateLabel: string;
    appointmentId: string;
  }[];
  medicalRecords: {
    id: string;
    content: string;
    recordType: string;
    title: string | null;
    createdAtLabel: string;
    appointmentDateLabel: string | null;
    appointmentId: string | null;
  }[];
  timeline: TimelineEventView[];
};

/**
 * Histórico clínico do paciente no escopo do prestador logado.
 * Inclui apenas atendimentos, procedimentos e PEP deste provider.
 */
export async function getProviderPatientOverview(
  patientId: string,
  providerId: string,
  tenantId: string,
): Promise<ProviderPatientOverviewData | null> {
  const prisma = await getPrisma();
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, tenantId },
    include: { company: true },
  });

  if (!patient) return null;

  const appointments = await prisma.appointment.findMany({
    where: { patientId, providerId, tenantId },
    include: {
      usages: { include: { procedure: true }, orderBy: { performedAt: "asc" } },
      medicalRecords: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { scheduledAt: "desc" },
  });

  if (appointments.length === 0) return null;

  const appointmentIds = appointments.map((a) => a.id);
  const usageIds = appointments.flatMap((a) => a.usages.map((u) => u.id));
  const recordIds = appointments.flatMap((a) => a.medicalRecords.map((r) => r.id));

  const mappedAppointments = appointments.map((appointment) => ({
    id: appointment.id,
    scheduledAt: appointment.scheduledAt.toISOString(),
    scheduledAtLabel: dateTime(appointment.scheduledAt),
    status: appointment.status,
    modality: appointment.modality,
    reason: appointment.reason,
    usagesCount: appointment.usages.length,
  }));

  const usages = appointments
    .flatMap((appointment) =>
      appointment.usages.map((usage) => ({
        id: usage.id,
        procedure: usage.procedure.name,
        category: usage.procedure.category,
        performedAtLabel: dateTime(usage.performedAt),
        appointmentDateLabel: dateTime(appointment.scheduledAt),
        appointmentId: appointment.id,
        sortKey: usage.performedAt.getTime(),
      })),
    )
    .sort((a, b) => b.sortKey - a.sortKey)
    .map(({ sortKey, ...usage }) => {
      void sortKey;
      return usage;
    });

  const medicalRecords = appointments
    .flatMap((appointment) =>
      appointment.medicalRecords.map((record) => ({
        id: record.id,
        content: record.content,
        recordType: record.recordType,
        title: record.title,
        createdAtLabel: dateTime(record.createdAt),
        appointmentDateLabel: dateTime(appointment.scheduledAt),
        appointmentId: appointment.id,
        sortKey: record.createdAt.getTime(),
      })),
    )
    .sort((a, b) => b.sortKey - a.sortKey)
    .map(({ sortKey, ...record }) => {
      void sortKey;
      return record;
    });

  const now = Date.now();
  const past = mappedAppointments.filter((a) => new Date(a.scheduledAt).getTime() < now);
  const future = mappedAppointments.filter((a) => new Date(a.scheduledAt).getTime() >= now);

  const timeline = await getPatientTimelineEvents(patientId, tenantId, {
    appointmentIds,
    usageIds,
    recordIds,
    invoiceIds: [],
    subscriptionIds: [],
    messageIds: [],
  });

  return {
    patient: {
      id: patient.id,
      name: patient.name,
      cpf: patient.cpf,
      birthDateLabel: dateOnly(patient.birthDate),
      phone: patient.phone,
      company: patient.company?.name ?? null,
    },
    summary: {
      totalAppointments: mappedAppointments.length,
      totalUsages: usages.length,
      totalRecords: medicalRecords.length,
      lastVisitLabel: past[0]?.scheduledAtLabel ?? null,
      nextVisitLabel: future[future.length - 1]?.scheduledAtLabel ?? null,
    },
    appointments: mappedAppointments,
    usages,
    medicalRecords,
    timeline: timeline.slice(0, 20),
  };
}
