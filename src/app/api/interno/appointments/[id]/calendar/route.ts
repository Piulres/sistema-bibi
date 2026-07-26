import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { loadAppointmentForCalendar } from "@/lib/calendar/calendar-feed-service";
import {
  buildAppointmentCalendarPayload,
  mapRowToCalendarSource,
} from "@/lib/calendar/appointment-calendar-response";

/**
 * Links Google/Outlook + ICS de um agendamento (portal interno).
 * `?format=ics` devolve o arquivo .ics para download.
 */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/interno/appointments/[id]/calendar">,
) {
  try {
    const user = await requireInternoModule("agenda");
    const { id } = await ctx.params;
    const row = await loadAppointmentForCalendar({
      tenantId: user.tenantId,
      appointmentId: id,
    });
    if (!row) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    const payload = buildAppointmentCalendarPayload(mapRowToCalendarSource(row));
    const format = new URL(request.url).searchParams.get("format");
    if (format === "ics") {
      return new NextResponse(payload.ics, {
        status: 200,
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": `attachment; filename="${payload.filename}"`,
        },
      });
    }

    return NextResponse.json(payload);
  } catch (error) {
    return authErrorResponse(error);
  }
}
