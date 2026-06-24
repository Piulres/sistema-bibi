import { describe, expect, it } from "vitest";
import {
  findAvailableProviderAt,
  getAvailableSlotsAcrossProviders,
} from "@/lib/scheduling-service";
import { createAppointment } from "@/lib/appointment-service";
import { getTestPrisma } from "../helpers/db";
import { DEMO_EMAILS } from "../helpers/seed-fixtures";

describe("scheduling without provider preference", () => {
  it("atribui prestador automaticamente quando autoAssignProvider", async () => {
    const prisma = getTestPrisma();
    const tenant = await prisma.tenant.findFirst({ where: { slug: "horizonte" } });
    const patient = await prisma.patient.findFirst({
      where: { tenantId: tenant!.id, name: { contains: "João Pereira" } },
    });
    const provider = await prisma.user.findFirst({
      where: { tenantId: tenant!.id, email: DEMO_EMAILS.prestador },
    });
    expect(patient).toBeTruthy();
    expect(provider).toBeTruthy();

    const slot = new Date();
    slot.setDate(slot.getDate() + 14);
    slot.setHours(10, 0, 0, 0);

    const assigned = await findAvailableProviderAt({
      tenantId: tenant!.id,
      scheduledAt: slot,
    });
    expect(assigned?.id).toBeTruthy();

    const procedure = await prisma.procedure.findFirst({
      where: { tenantId: tenant!.id, code: "EXA-ECG" },
    });

    const result = await createAppointment({
      tenantId: tenant!.id,
      patientId: patient!.id,
      procedureId: procedure!.id,
      scheduledAt: slot,
      autoAssignProvider: true,
      createdBy: provider!.id,
    });

    expect("appointment" in result).toBe(true);
    if ("appointment" in result) {
      expect(result.appointment.providerId).toBeTruthy();
      expect(result.appointment.procedureId).toBe(procedure!.id);
      expect(result.appointment.procedureName).toBe("Eletrocardiograma");
    }
  });

  it("lista slots de todos os prestadores em uma data", async () => {
    const prisma = getTestPrisma();
    const tenant = await prisma.tenant.findFirst({ where: { slug: "horizonte" } });
    const date = new Date();
    date.setDate(date.getDate() + 3);

    const { slots } = await getAvailableSlotsAcrossProviders({
      tenantId: tenant!.id,
      date,
    });

    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0]?.providerId).toBeTruthy();
    expect(slots[0]?.providerName).toBeTruthy();
  });
});
