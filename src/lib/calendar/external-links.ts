import { APPOINTMENT_SLOT_MINUTES } from "@/lib/calendar/ics";
import type { AppointmentCalendarSource } from "@/lib/calendar/appointment-event";
import { appointmentToIcsEvent } from "@/lib/calendar/appointment-event";
import { formatIcsUtc } from "@/lib/calendar/ics";

export type ExternalCalendarLinks = {
  googleUrl: string;
  outlookUrl: string;
  office365Url: string;
  /** Duração usada nos links (minutos). */
  durationMinutes: number;
};

function encodeQuery(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

/**
 * Links one-shot para abrir o evento no Google Calendar / Outlook / Office 365.
 * Não exige OAuth — o usuário confirma no próprio calendário.
 */
export function buildExternalCalendarLinks(
  appointment: AppointmentCalendarSource,
): ExternalCalendarLinks {
  const event = appointmentToIcsEvent(appointment);
  const start = formatIcsUtc(event.start);
  const end = formatIcsUtc(event.end);
  const details = event.description ?? "";
  const location = event.location ?? "";

  const googleUrl = `https://calendar.google.com/calendar/render?${encodeQuery({
    action: "TEMPLATE",
    text: event.summary,
    dates: `${start}/${end}`,
    details,
    location,
  })}`;

  const outlookQuery = encodeQuery({
    subject: event.summary,
    body: details,
    location,
    startdt: event.start.toISOString(),
    enddt: event.end.toISOString(),
  });

  return {
    googleUrl,
    outlookUrl: `https://outlook.live.com/calendar/0/deeplink/compose?${outlookQuery}`,
    office365Url: `https://outlook.office.com/calendar/0/deeplink/compose?${outlookQuery}`,
    durationMinutes: APPOINTMENT_SLOT_MINUTES,
  };
}
