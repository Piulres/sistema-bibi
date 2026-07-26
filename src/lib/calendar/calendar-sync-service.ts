import "server-only";
import { getPrisma } from "@/lib/db";
import { appointmentToIcsEvent } from "@/lib/calendar/appointment-event";
import { getValidAccessToken } from "@/lib/calendar/calendar-connection-service";
import { getCalendarAdapter } from "@/lib/calendar/providers";
import type { CalendarProviderId } from "@/lib/calendar/providers/types";

/**
 * Empurra um agendamento para todas as conexões OAuth relevantes:
 * - conexões PROVIDER do prestador do appointment
 * - conexões TENANT do mesmo tenant (agenda da operação)
 */
export async function syncAppointmentToExternalCalendars(
  appointmentId: string,
): Promise<{ synced: number; errors: number }> {
  const prisma = await getPrisma();
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { select: { name: true } },
      pet: { select: { name: true } },
      provider: { select: { name: true } },
      procedure: { select: { name: true } },
    },
  });
  if (!appointment) return { synced: 0, errors: 0 };

  const connections = await prisma.calendarConnection.findMany({
    where: {
      tenantId: appointment.tenantId,
      status: "ACTIVE",
      OR: [
        { scope: "PROVIDER", userId: appointment.providerId },
        { scope: "TENANT" },
      ],
    },
  });

  if (connections.length === 0) return { synced: 0, errors: 0 };

  const icsEvent = appointmentToIcsEvent({
    id: appointment.id,
    scheduledAt: appointment.scheduledAt,
    status: appointment.status,
    modality: appointment.modality,
    telemedicineUrl: appointment.telemedicineUrl,
    reason: appointment.reason,
    patientName: appointment.patient.name,
    petName: appointment.pet?.name ?? null,
    providerName: appointment.provider.name,
    procedureName: appointment.procedure?.name ?? null,
  });

  const shouldDelete =
    icsEvent.status === "CANCELLED" ||
    appointment.status === "CANCELADO" ||
    appointment.status === "FALTOU";

  let synced = 0;
  let errors = 0;

  for (const connection of connections) {
    const auth = await getValidAccessToken(connection.id);
    if (!auth) {
      errors += 1;
      continue;
    }

    const adapter = getCalendarAdapter(auth.provider);
    const mapping = await prisma.appointmentExternalEvent.findUnique({
      where: {
        appointmentId_connectionId: {
          appointmentId: appointment.id,
          connectionId: connection.id,
        },
      },
    });

    try {
      if (shouldDelete) {
        if (mapping) {
          await adapter.deleteEvent({
            accessToken: auth.accessToken,
            calendarId: auth.calendarId,
            externalEventId: mapping.externalEventId,
          });
          await prisma.appointmentExternalEvent.delete({ where: { id: mapping.id } });
        }
      } else {
        const result = await adapter.upsertEvent({
          accessToken: auth.accessToken,
          calendarId: auth.calendarId,
          externalEventId: mapping?.externalEventId,
          event: {
            summary: icsEvent.summary,
            description: icsEvent.description ?? "",
            location: icsEvent.location,
            start: icsEvent.start,
            end: icsEvent.end,
            status: icsEvent.status ?? "CONFIRMED",
            iCalUID: icsEvent.uid,
          },
        });
        await prisma.appointmentExternalEvent.upsert({
          where: {
            appointmentId_connectionId: {
              appointmentId: appointment.id,
              connectionId: connection.id,
            },
          },
          create: {
            appointmentId: appointment.id,
            connectionId: connection.id,
            externalEventId: result.externalEventId,
          },
          update: {
            externalEventId: result.externalEventId,
            lastSyncedAt: new Date(),
          },
        });
      }

      await prisma.calendarConnection.update({
        where: { id: connection.id },
        data: { lastSyncedAt: new Date(), lastError: null, status: "ACTIVE" },
      });
      synced += 1;
    } catch (error) {
      errors += 1;
      const message = error instanceof Error ? error.message : "Falha de sync";
      console.error(
        `[calendar-sync] ${connection.provider as CalendarProviderId} connection=${connection.id}:`,
        message,
      );
      await prisma.calendarConnection.update({
        where: { id: connection.id },
        data: { lastError: message, status: "ERROR" },
      });
    }
  }

  return { synced, errors };
}

/** Fire-and-forget seguro para handlers de API. */
export function queueAppointmentCalendarSync(appointmentId: string): void {
  void syncAppointmentToExternalCalendars(appointmentId).catch((error) => {
    console.error("[calendar-sync] queue failed", error);
  });
}
