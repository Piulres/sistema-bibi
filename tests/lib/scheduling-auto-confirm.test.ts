import { describe, expect, it, vi, beforeEach } from "vitest";

const mockPrisma = {
  appointment: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(async () => null),
  },
  tenant: {
    findFirst: vi.fn(),
  },
  patient: {
    findFirst: vi.fn(),
  },
  user: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  procedure: {
    findFirst: vi.fn(),
  },
  message: {
    create: vi.fn(),
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
    CREATED: "CREATED",
    MESSAGE_QUEUED: "MESSAGE_QUEUED",
    CANCELLED: "CANCELLED",
    RESCHEDULED: "RESCHEDULED",
  },
  TIMELINE_ENTITY_TYPES: { APPOINTMENT: "Appointment", MESSAGE: "Message" },
}));

vi.mock("@/lib/availability/provider-availability-service", () => ({
  resolveWindowsForProviderDay: vi.fn(async () => ({
    windows: [{ startMinute: 8 * 60, endMinute: 18 * 60, slotMinutes: 30 }],
    usingDefault: true,
  })),
  loadBlocksForDay: vi.fn(async () => []),
}));

const futureSlot = new Date(Date.now() + 3 * 60 * 60_000);

vi.mock("@/lib/availability/slot-grid", () => ({
  generateDaySlots: vi.fn(() => [
    { start: futureSlot, end: new Date(futureSlot.getTime() + 30 * 60_000) },
  ]),
}));

import { recordTimelineEvent } from "@/lib/timeline";
import { bookBeneficiaryAppointment } from "@/lib/scheduling-service";

describe("bookBeneficiaryAppointment — confirmação automática pós-agendamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.appointment.findMany.mockResolvedValue([]);
    mockPrisma.tenant.findFirst.mockResolvedValue({ niche: "MEDICAL" });
    mockPrisma.patient.findFirst.mockResolvedValue({
      id: "p1",
      name: "Camila Rocha",
      tenantId: "t1",
    });
    mockPrisma.user.findFirst.mockResolvedValue({
      id: "prov1",
      name: "Dra. Helena Costa",
      role: "PRESTADOR",
      tenantId: "t1",
    });
    mockPrisma.appointment.findFirst.mockResolvedValue(null);
    mockPrisma.appointment.create.mockResolvedValue({
      id: "a1",
      tenantId: "t1",
      patientId: "p1",
      providerId: "prov1",
      procedureId: null,
      petId: null,
      scheduledAt: futureSlot,
      reason: null,
      status: "CONFIRMADO",
      modality: "PRESENCIAL",
      telemedicineUrl: null,
      patient: { name: "Camila Rocha", company: null },
      pet: null,
      provider: { name: "Dra. Helena Costa" },
      procedure: null,
    });
    mockPrisma.message.create.mockResolvedValue({
      id: "m1",
      channel: "EMAIL",
      template: "APPOINTMENT_CONFIRMATION",
      status: "PENDENTE",
      subject: "Consulta confirmada",
      body: "Olá",
      createdAt: new Date(),
      sentAt: null,
      error: null,
      patient: { name: "Camila Rocha", phone: null },
    });
  });

  it("cria em CONFIRMADO e enfileira mensagem APPOINTMENT_CONFIRMATION (sem recepção)", async () => {
    const result = await bookBeneficiaryAppointment({
      tenantId: "t1",
      patientId: "p1",
      providerId: "prov1",
      scheduledAt: futureSlot,
      createdBy: "u1",
    });

    expect(result).toMatchObject({
      appointment: expect.objectContaining({
        id: "a1",
        status: "CONFIRMADO",
      }),
    });
    expect(mockPrisma.appointment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "CONFIRMADO" }),
      }),
    );
    expect(mockPrisma.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          template: "APPOINTMENT_CONFIRMATION",
          channel: "EMAIL",
          status: "PENDENTE",
        }),
      }),
    );
    expect(recordTimelineEvent).toHaveBeenCalled();
  });
});
