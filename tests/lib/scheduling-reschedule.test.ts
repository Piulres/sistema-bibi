import { describe, expect, it, vi, beforeEach } from "vitest";

const mockPrisma = {
  appointment: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(async () => null),
    update: vi.fn(),
  },
  webhookEndpoint: {
    findMany: vi.fn(async () => []),
  },
  calendarConnection: {
    findMany: vi.fn(async () => []),
  },
};

vi.mock("@/lib/db", () => ({
  getPrisma: vi.fn(async () => mockPrisma),
}));

vi.mock("@/lib/timeline", () => ({
  recordTimelineEvent: vi.fn(),
  TIMELINE_ACTIONS: {
    UPDATED: "UPDATED",
    CANCELLED: "CANCELLED",
    RESCHEDULED: "RESCHEDULED",
  },
  TIMELINE_ENTITY_TYPES: { APPOINTMENT: "Appointment" },
}));

const futureNew = new Date(Date.now() + 4 * 60 * 60_000);

vi.mock("@/lib/availability/provider-availability-service", () => ({
  resolveWindowsForProviderDay: vi.fn(async () => ({
    windows: [{ startMinute: 8 * 60, endMinute: 12 * 60, slotMinutes: 30 }],
    usingDefault: true,
  })),
  loadBlocksForDay: vi.fn(async () => []),
}));

vi.mock("@/lib/availability/slot-grid", () => ({
  generateDaySlots: vi.fn(() => [{ start: futureNew, end: new Date(futureNew.getTime() + 30 * 60_000) }]),
}));

import { recordTimelineEvent } from "@/lib/timeline";
import { rescheduleBeneficiaryAppointment } from "@/lib/scheduling-service";

const findFirst = mockPrisma.appointment.findFirst;
const findMany = mockPrisma.appointment.findMany;
const update = mockPrisma.appointment.update;

describe("rescheduleBeneficiaryAppointment — troca horário sem cancelar+criar", () => {
  const futureOld = new Date(Date.now() + 2 * 60 * 60_000);

  const baseInput = {
    tenantId: "t1",
    patientId: "p1",
    appointmentId: "a1",
    scheduledAt: futureNew,
    providerId: "prov1",
    createdBy: "u1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    findMany.mockResolvedValue([]);
  });

  it("rejeita quando o agendamento não existe (evita vazamento cross-tenant)", async () => {
    findFirst.mockResolvedValue(null);
    const result = await rescheduleBeneficiaryAppointment(baseInput);
    expect(result).toEqual({ error: "Agendamento não encontrado" });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejeita status terminal (REALIZADO) — só futuros gerenciáveis", async () => {
    findFirst.mockResolvedValue({
      id: "a1",
      status: "REALIZADO",
      scheduledAt: futureOld,
      providerId: "prov1",
      patientId: "p1",
      modality: "PRESENCIAL",
      telemedicineUrl: null,
      patient: { name: "Camila Rocha" },
    });
    const result = await rescheduleBeneficiaryAppointment(baseInput);
    expect(result).toEqual({
      error: "Somente consultas futuras (agendadas ou confirmadas) podem ser reagendadas",
    });
  });

  it("atualiza scheduledAt no mesmo registro CONFIRMADO e grava timeline RESCHEDULED", async () => {
    findFirst.mockResolvedValue({
      id: "a1",
      status: "CONFIRMADO",
      scheduledAt: futureOld,
      providerId: "prov1",
      patientId: "p1",
      modality: "PRESENCIAL",
      telemedicineUrl: null,
      patient: { name: "Camila Rocha" },
    });
    update.mockResolvedValue({});

    const result = await rescheduleBeneficiaryAppointment(baseInput);

    expect(result).toMatchObject({
      ok: true,
      status: "AGENDADO",
      scheduledAt: futureNew.toISOString(),
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: {
        scheduledAt: futureNew,
        providerId: "prov1",
      },
    });
    expect(recordTimelineEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "RESCHEDULED",
        entityId: "a1",
      }),
    );
  });
});
