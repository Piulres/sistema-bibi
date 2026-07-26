import {
  APPOINTMENT_SLOT_MINUTES,
  appointmentEndAt,
  type IcsEventInput,
  type IcsEventStatus,
} from "@/lib/calendar/ics";

export type AppointmentCalendarSource = {
  id: string;
  scheduledAt: Date;
  status: string;
  modality: string;
  telemedicineUrl: string | null;
  reason: string | null;
  patientName: string;
  petName?: string | null;
  providerName: string;
  procedureName?: string | null;
  /** Rótulo do tipo de atendimento (via labels do nicho). */
  appointmentLabel?: string;
};

function mapStatus(status: string): IcsEventStatus {
  if (status === "CANCELADO" || status === "FALTOU") return "CANCELLED";
  if (status === "AGENDADO") return "TENTATIVE";
  return "CONFIRMED";
}

/** UID estável para sync em clientes (Google/Outlook/Apple). */
export function appointmentCalendarUid(appointmentId: string): string {
  return `appointment-${appointmentId}@bibi.serviceos`;
}

export function appointmentToIcsEvent(
  appointment: AppointmentCalendarSource,
): IcsEventInput {
  const label = appointment.appointmentLabel ?? "Atendimento";
  const subjectName =
    appointment.petName?.trim() ||
    appointment.patientName.trim() ||
    label;
  const summary =
    appointment.procedureName?.trim()
      ? `${label}: ${subjectName} — ${appointment.procedureName.trim()}`
      : `${label}: ${subjectName}`;

  const parts: string[] = [
    `Prestador: ${appointment.providerName}`,
    `Status: ${appointment.status}`,
  ];
  if (appointment.petName) {
    parts.push(`Tutor: ${appointment.patientName}`);
  }
  if (appointment.reason?.trim()) {
    parts.push(appointment.reason.trim());
  }
  if (appointment.modality === "TELE" && appointment.telemedicineUrl) {
    parts.push(`Telemedicina: ${appointment.telemedicineUrl}`);
  } else if (appointment.modality === "TELE") {
    parts.push("Modalidade: telemedicina");
  }

  return {
    uid: appointmentCalendarUid(appointment.id),
    summary,
    description: parts.join("\n"),
    location:
      appointment.modality === "TELE"
        ? (appointment.telemedicineUrl ?? "Telemedicina")
        : undefined,
    start: appointment.scheduledAt,
    end: appointmentEndAt(appointment.scheduledAt, APPOINTMENT_SLOT_MINUTES),
    status: mapStatus(appointment.status),
    url: appointment.telemedicineUrl ?? undefined,
    dtStamp: new Date(),
  };
}
