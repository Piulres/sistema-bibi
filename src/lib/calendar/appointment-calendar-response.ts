import { buildIcsCalendar } from "@/lib/calendar/ics";
import {
  appointmentToIcsEvent,
  type AppointmentCalendarSource,
} from "@/lib/calendar/appointment-event";
import { buildExternalCalendarLinks } from "@/lib/calendar/external-links";

export function buildAppointmentCalendarPayload(
  source: AppointmentCalendarSource,
) {
  const event = appointmentToIcsEvent(source);
  const links = buildExternalCalendarLinks(source);
  const ics = buildIcsCalendar({
    calendarName: event.summary,
    events: [event],
  });

  return {
    appointmentId: source.id,
    links,
    ics,
    filename: `agendamento-${source.id}.ics`,
  };
}

export function mapRowToCalendarSource(row: {
  id: string;
  scheduledAt: Date;
  status: string;
  modality: string;
  telemedicineUrl: string | null;
  reason: string | null;
  patient: { name: string };
  pet: { name: string } | null;
  provider: { name: string };
  procedure: { name: string } | null;
  appointmentLabel?: string;
}): AppointmentCalendarSource {
  return {
    id: row.id,
    scheduledAt: row.scheduledAt,
    status: row.status,
    modality: row.modality,
    telemedicineUrl: row.telemedicineUrl,
    reason: row.reason,
    patientName: row.patient.name,
    petName: row.pet?.name ?? null,
    providerName: row.provider.name,
    procedureName: row.procedure?.name ?? null,
    appointmentLabel: row.appointmentLabel,
  };
}
