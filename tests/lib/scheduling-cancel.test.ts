import { describe, expect, it, vi } from "vitest";

const mockPrisma = {
  appointment: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  getPrisma: vi.fn(async () => mockPrisma),
}));

vi.mock("@/lib/timeline", () => ({
  recordTimelineEvent: vi.fn(),
  TIMELINE_ACTIONS: { UPDATED: "UPDATED" },
  TIMELINE_ENTITY_TYPES: { APPOINTMENT: "Appointment" },
}));

import { recordTimelineEvent } from "@/lib/timeline";
import { cancelBeneficiaryAppointment } from "@/lib/scheduling-service";

const findFirst = mockPrisma.appointment.findFirst;
const update = mockPrisma.appointment.update;

describe("cancelBeneficiaryAppointment", () => {
  const baseInput = {
    tenantId: "t1",
    patientId: "p1",
    appointmentId: "a1",
    createdBy: "u1",
  };

  it("rejeita quando não encontrado", async () => {
    findFirst.mockResolvedValue(null);
    const result = await cancelBeneficiaryAppointment(baseInput);
    expect(result).toEqual({ error: "Agendamento não encontrado" });
  });

  it("rejeita status diferente de AGENDADO", async () => {
    findFirst.mockResolvedValue({
      id: "a1",
      status: "CONFIRMADO",
      scheduledAt: new Date(Date.now() + 60_000),
      patient: { name: "João" },
    });
    const result = await cancelBeneficiaryAppointment(baseInput);
    expect(result).toEqual({ error: "Somente consultas agendadas podem ser canceladas" });
  });

  it("cancela consulta futura em AGENDADO", async () => {
    findFirst.mockResolvedValue({
      id: "a1",
      status: "AGENDADO",
      scheduledAt: new Date(Date.now() + 60_000),
      patient: { name: "João" },
    });
    update.mockResolvedValue({});

    const result = await cancelBeneficiaryAppointment(baseInput);
    expect(result).toEqual({ ok: true, status: "CANCELADO" });
    expect(update).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: { status: "CANCELADO" },
    });
    expect(recordTimelineEvent).toHaveBeenCalled();
  });
});
