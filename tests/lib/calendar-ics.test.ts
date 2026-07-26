import { describe, expect, it } from "vitest";
import {
  APPOINTMENT_SLOT_MINUTES,
  appointmentEndAt,
  buildIcsCalendar,
  escapeIcsText,
  foldIcsLine,
  formatIcsUtc,
} from "@/lib/calendar/ics";
import { appointmentToIcsEvent } from "@/lib/calendar/appointment-event";
import { buildExternalCalendarLinks } from "@/lib/calendar/external-links";

describe("calendar/ics", () => {
  it("formata UTC compacto", () => {
    expect(formatIcsUtc(new Date("2026-07-26T13:30:00.000Z"))).toBe(
      "20260726T133000Z",
    );
  });

  it("escapa caracteres especiais ICS", () => {
    expect(escapeIcsText("A;B,C\\D\nE")).toBe("A\\;B\\,C\\\\D\\nE");
  });

  it("dobra linhas longas com CRLF e espaço continuado", () => {
    const long = `SUMMARY:${"x".repeat(90)}`;
    const folded = foldIcsLine(long);
    expect(folded.includes("\r\n ")).toBe(true);
    expect(folded.split("\r\n")[0]!.length).toBeLessThanOrEqual(75);
  });

  it("gera VCALENDAR com evento e duração padrão de slot", () => {
    const start = new Date("2026-08-01T12:00:00.000Z");
    const end = appointmentEndAt(start);
    expect((end.getTime() - start.getTime()) / 60_000).toBe(APPOINTMENT_SLOT_MINUTES);

    const ics = buildIcsCalendar({
      calendarName: "Agenda teste",
      events: [
        {
          uid: "appointment-abc@bibi.serviceos",
          summary: "Atendimento: Ana",
          description: "Prestador: Dr. X",
          start,
          end,
          status: "TENTATIVE",
        },
      ],
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("UID:appointment-abc@bibi.serviceos");
    expect(ics).toContain("STATUS:TENTATIVE");
    expect(ics).toContain("DTSTART:20260801T120000Z");
    expect(ics).toContain("DTEND:20260801T123000Z");
    expect(ics.endsWith("\r\n")).toBe(true);
  });
});

describe("calendar/appointment-event + external-links", () => {
  const base = {
    id: "appt_1",
    scheduledAt: new Date("2026-08-01T15:00:00.000Z"),
    status: "AGENDADO",
    modality: "PRESENCIAL",
    telemedicineUrl: null,
    reason: "Retorno",
    patientName: "João Pereira",
    providerName: "Dra. Helena",
    appointmentLabel: "Consulta",
  };

  it("mapeia status e monta summary com label", () => {
    const event = appointmentToIcsEvent(base);
    expect(event.uid).toBe("appointment-appt_1@bibi.serviceos");
    expect(event.summary).toContain("Consulta: João Pereira");
    expect(event.status).toBe("TENTATIVE");
    expect(event.description).toContain("Retorno");
  });

  it("marca cancelado como CANCELLED", () => {
    const event = appointmentToIcsEvent({ ...base, status: "CANCELADO" });
    expect(event.status).toBe("CANCELLED");
  });

  it("usa pet no summary quando presente", () => {
    const event = appointmentToIcsEvent({
      ...base,
      petName: "Thor",
      appointmentLabel: "Consulta",
    });
    expect(event.summary).toContain("Thor");
    expect(event.description).toContain("Tutor: João Pereira");
  });

  it("gera links Google e Outlook com datas", () => {
    const links = buildExternalCalendarLinks(base);
    expect(links.googleUrl).toContain("calendar.google.com");
    expect(links.googleUrl).toContain("action=TEMPLATE");
    expect(links.outlookUrl).toContain("outlook.live.com");
    expect(links.office365Url).toContain("outlook.office.com");
    expect(links.durationMinutes).toBe(30);
  });
});
