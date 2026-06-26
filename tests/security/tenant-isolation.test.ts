import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as patientOverviewGet } from "@/app/api/interno/patients/[id]/overview/route";
import { getTestPrisma } from "../helpers/db";
import {
  clearSessionMock,
  sessionMockState,
  setSessionForEmail,
} from "../helpers/session-mock";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === "bibi_session" && sessionMockState.token
        ? { value: sessionMockState.token }
        : undefined,
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

describe("Segurança — isolamento cross-tenant", () => {
  afterEach(() => {
    clearSessionMock();
  });

  it("interno de um tenant não acessa paciente de outro tenant", async () => {
    const prisma = getTestPrisma();
    const homeTenant = await prisma.tenant.findFirst({ where: { slug: "horizonte" } });
    const foreignTenant = await prisma.tenant.findFirst({
      where: { slug: "petcare" },
    });

    expect(homeTenant).toBeTruthy();
    expect(foreignTenant).toBeTruthy();
    if (!homeTenant || !foreignTenant) return;

    const foreignPatient = await prisma.patient.findFirst({
      where: { tenantId: foreignTenant.id },
      select: { id: true, tenantId: true },
    });

    expect(foreignPatient).toBeTruthy();
    if (!foreignPatient) return;

    await setSessionForEmail("faturamento@bibi.health");
    const sessionUser = await prisma.user.findUniqueOrThrow({
      where: { email: "faturamento@bibi.health" },
    });
    expect(sessionUser.tenantId).toBe(homeTenant.id);
    expect(foreignPatient.tenantId).toBe(foreignTenant.id);
    expect(foreignPatient.tenantId).not.toBe(homeTenant.id);

    const res = await patientOverviewGet(
      new Request("http://localhost"),
      { params: Promise.resolve({ id: foreignPatient.id }) },
    );
    expect(res.status).toBe(404);
  });
});
