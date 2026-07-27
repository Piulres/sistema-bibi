import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = {
  patient: {
    findFirst: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  getPrisma: vi.fn(async () => mockPrisma),
}));

vi.mock("@/lib/scheduling-service", () => ({
  bookBeneficiaryAppointment: vi.fn(async () => ({
    appointment: { id: "a1", status: "CONFIRMADO", patientId: "p-tech" },
  })),
}));

import { bookBeneficiaryAppointment } from "@/lib/scheduling-service";
import { assertCompanyPatient, bookPjAppointment } from "@/lib/pj-appointment-service";

describe("assertCompanyPatient — escopo PJ antes de bookBeneficiaryAppointment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("falha quando patient.companyId ≠ session.companyId para bloquear agendamento cruzado", async () => {
    mockPrisma.patient.findFirst.mockResolvedValue(null);
    const result = await assertCompanyPatient({
      tenantId: "t1",
      companyId: "techcorp",
      patientId: "p-outra",
    });
    expect(result).toEqual({ error: "Beneficiário não encontrado na empresa" });
  });

  it("aceita colaborador da mesma empresa e devolve o paciente", async () => {
    mockPrisma.patient.findFirst.mockResolvedValue({
      id: "p-tech",
      name: "João Pereira",
      companyId: "techcorp",
    });
    const result = await assertCompanyPatient({
      tenantId: "t1",
      companyId: "techcorp",
      patientId: "p-tech",
    });
    expect(result).toEqual({
      patient: { id: "p-tech", name: "João Pereira", companyId: "techcorp" },
    });
  });
});

describe("bookPjAppointment — só chama engine self-service após ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não chama bookBeneficiaryAppointment quando o paciente não é da empresa", async () => {
    mockPrisma.patient.findFirst.mockResolvedValue(null);
    const result = await bookPjAppointment({
      tenantId: "t1",
      companyId: "techcorp",
      patientId: "p-outra",
      scheduledAt: new Date(),
      autoAssignProvider: true,
      createdBy: "rh1",
    });
    expect(result).toEqual({ error: "Beneficiário não encontrado na empresa" });
    expect(bookBeneficiaryAppointment).not.toHaveBeenCalled();
  });

  it("encaminha patientId validado para bookBeneficiaryAppointment", async () => {
    mockPrisma.patient.findFirst.mockResolvedValue({
      id: "p-tech",
      name: "João Pereira",
      companyId: "techcorp",
    });
    const scheduledAt = new Date("2030-03-10T14:00:00.000Z");
    const result = await bookPjAppointment({
      tenantId: "t1",
      companyId: "techcorp",
      patientId: "p-tech",
      providerId: "prov1",
      scheduledAt,
      createdBy: "rh1",
      reason: "Check-up",
    });
    expect(result).toMatchObject({
      appointment: { id: "a1", status: "CONFIRMADO" },
    });
    expect(bookBeneficiaryAppointment).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "t1",
        patientId: "p-tech",
        providerId: "prov1",
        scheduledAt,
        createdBy: "rh1",
      }),
    );
  });
});
