import { describe, expect, it } from "vitest";
import { getPrisma } from "@/lib/db";
import { createExamLaunch } from "@/lib/clinic-finance/service";

describe("clinic-finance bridge integration", () => {
  it("lançamento PARTICULAR gera appointment + usage + invoice PAGA", async () => {
    const prisma = await getPrisma();
    const tenant =
      (await prisma.tenant.findFirst({ where: { slug: "cedig" } })) ??
      (await prisma.tenant.findFirst());
    expect(tenant).toBeTruthy();
    if (!tenant) return;

    const provider = await prisma.user.findFirst({
      where: { tenantId: tenant.id, role: "PRESTADOR" },
    });
    const procedure =
      (await prisma.procedure.findFirst({
        where: { tenantId: tenant.id, code: { startsWith: "CEDIG-" } },
      })) ??
      (await prisma.procedure.findFirst({ where: { tenantId: tenant.id } }));
    expect(provider && procedure).toBeTruthy();
    if (!provider || !procedure) return;

    const result = await createExamLaunch(tenant.id, {
      patientName: `Smoke Bridge ${Date.now()}`,
      providerId: provider.id,
      procedureId: procedure.id,
      paymentMethod: "PIX",
      priceTable: "PARTICULAR",
      amountReceived: 750,
      biopsies: 0,
      createdById: provider.id,
    });

    expect("error" in result).toBe(false);
    if ("error" in result) return;

    expect(result.bridge?.bridgeStatus).toBe("SYNCED");
    expect(result.launch.appointmentId).toBeTruthy();
    expect(result.launch.usageId).toBeTruthy();
    expect(result.launch.invoiceId).toBeTruthy();

    const invoice = await prisma.invoice.findUnique({
      where: { id: result.launch.invoiceId! },
      include: { payments: true },
    });
    expect(invoice?.status).toBe("PAGA");
    expect(invoice?.payments.length).toBeGreaterThanOrEqual(1);

    const appointment = await prisma.appointment.findUnique({
      where: { id: result.launch.appointmentId! },
    });
    expect(appointment?.status).toBe("REALIZADO");
    expect(appointment?.providerId).toBe(provider.id);
  });
});
