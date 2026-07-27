import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as importTemplateGet, POST as importPost } from "@/app/api/pj/beneficiaries/import/route";
import { jsonRequest } from "../helpers/request";
import { getTestPrisma } from "../helpers/db";
import {
  clearSessionMock,
  sessionMockState,
  setSessionForEmail,
} from "../helpers/session-mock";
import { buildPjBeneficiaryImportTemplate } from "@/lib/pj-beneficiary-import";

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

describe("GET/POST /api/pj/beneficiaries/import — upload CSV colaboradores", () => {
  afterEach(() => {
    clearSessionMock();
  });

  it("GET returns CSV template so RH downloads modelo before upload", async () => {
    await setSessionForEmail("rh@techcorp.com");
    const res = await importTemplateGet(new Request("http://localhost/api/pj/beneficiaries/import?format=csv"));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("nome");
    expect(text).toContain("cpf");
    expect(text).toContain("data_nascimento");
  });

  it("POST dry-run validates rows without persisting so RH previews errors", async () => {
    const cpf = "390.533.447-05";
    const csv = buildPjBeneficiaryImportTemplate("csv").replace(
      "529.982.247-25",
      cpf,
    );

    await setSessionForEmail("rh@techcorp.com");
    const res = await importPost(
      jsonRequest("http://localhost/api/pj/beneficiaries/import", {
        method: "POST",
        body: { content: csv, format: "csv", dryRun: true },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dryRun).toBe(true);
    expect(body.created).toBeGreaterThanOrEqual(1);
  });

  it("POST imports colaborador na empresa logada (TechCorp)", async () => {
    const prisma = getTestPrisma();
    const cpf = "52998224725";
    await prisma.patient.deleteMany({ where: { cpf } }).catch(() => {});

    const csv = buildPjBeneficiaryImportTemplate("csv").replace("Maria Silva", "Import CSV PJ Test");

    await setSessionForEmail("rh@techcorp.com");
    const rh = await prisma.user.findUniqueOrThrow({ where: { email: "rh@techcorp.com" } });

    const res = await importPost(
      jsonRequest("http://localhost/api/pj/beneficiaries/import", {
        method: "POST",
        body: { content: csv, format: "csv", dryRun: false },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.created).toBe(1);

    const row = await prisma.patient.findUniqueOrThrow({ where: { cpf } });
    expect(row.name).toBe("Import CSV PJ Test");
    expect(row.companyId).toBe(rh.companyId);
  });
});
