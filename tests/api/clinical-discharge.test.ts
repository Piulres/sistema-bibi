import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as referralsGet, POST as referralsPost } from "@/app/api/prestador/patients/[id]/referrals/route";
import { GET as dischargeGet } from "@/app/api/prestador/patients/[id]/discharge-documents/route";
import { GET as guidesExportGet } from "@/app/api/prestador/clinical-guides/export/route";
import { GET as beneficiarioDocumentsGet } from "@/app/api/beneficiario/documents/route";
import { GET as beneficiarioGuidesExportGet } from "@/app/api/beneficiario/clinical-guides/export/route";
import { jsonRequest } from "../helpers/request";
import { getTestPrisma } from "../helpers/db";
import { getDemoJoao } from "../helpers/seed-fixtures";
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

describe("Documentos de saída — encaminhamento, hub e PDF no atendimento", () => {
  afterEach(() => {
    clearSessionMock();
  });

  it("prestador emite encaminhamento, lista no hub e exporta PDF tipográfico", async () => {
    const joao = await getDemoJoao();
    await setSessionForEmail("dra.helena@bibi.health");

    const createRes = await referralsPost(
      jsonRequest(`http://localhost/api/prestador/patients/${joao.id}/referrals`, {
        method: "POST",
        body: {
          specialty: "Cardiologia",
          urgency: "BREVE",
          clinicalReason: "Dor torácica atípica com fatores de risco cardiovascular.",
          requestedActions: "ECG e estratificação de risco.",
          referralKind: "ESPECIALIDADE",
        },
      }),
      { params: Promise.resolve({ id: joao.id }) },
    );
    expect(createRes.status).toBe(200);
    const created = await createRes.json();
    expect(created.referral?.id).toBeTruthy();
    expect(created.referral.specialty).toBe("Cardiologia");

    const listRes = await referralsGet(
      new Request(`http://localhost/api/prestador/patients/${joao.id}/referrals`),
      { params: Promise.resolve({ id: joao.id }) },
    );
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.referrals.some((r: { id: string }) => r.id === created.referral.id)).toBe(
      true,
    );

    const hubRes = await dischargeGet(
      new Request(`http://localhost/api/prestador/patients/${joao.id}/discharge-documents`),
      { params: Promise.resolve({ id: joao.id }) },
    );
    expect(hubRes.status).toBe(200);
    const hub = await hubRes.json();
    expect(hub.documents.some((d: { kind: string }) => d.kind === "ENCAMINHAMENTO")).toBe(true);
    expect(Array.isArray(hub.referralTemplates)).toBe(true);
    expect(hub.referralTemplates.length).toBeGreaterThan(0);

    const pdfRes = await guidesExportGet(
      new Request(
        `http://localhost/api/prestador/clinical-guides/export?type=encaminhamento&id=${created.referral.id}&format=pdf`,
      ),
    );
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers.get("content-type")).toBe("application/pdf");
    expect(pdfRes.headers.get("cache-control")).toMatch(/no-store/i);
    const disposition = pdfRes.headers.get("content-disposition") ?? "";
    expect(disposition.toLowerCase()).toContain("encaminhamento-");
    expect(disposition.toLowerCase()).toContain("joao");
    const buffer = Buffer.from(await pdfRes.arrayBuffer());
    expect(buffer.subarray(0, 4).toString("utf8")).toBe("%PDF");
    expect(buffer.length).toBeGreaterThan(500);

    const prisma = getTestPrisma();
    const exportEvent = await prisma.timelineEvent.findFirst({
      where: {
        action: "DOCUMENT_EXPORTED",
        entityId: created.referral.id,
      },
      orderBy: { createdAt: "desc" },
    });
    expect(exportEvent).toBeTruthy();
  });

  it("exporta atestado no layout tipográfico e rejeita type inválido — PHI não vaza cache", async () => {
    const prisma = getTestPrisma();
    const joao = await getDemoJoao();
    await setSessionForEmail("dra.helena@bibi.health");

    const atestado = await prisma.medicalRecord.findFirst({
      where: { patientId: joao.id, recordType: "ATESTADO" },
      orderBy: { createdAt: "desc" },
    });
    expect(atestado).toBeTruthy();

    const bad = await guidesExportGet(
      new Request(
        "http://localhost/api/prestador/clinical-guides/export?type=xlsx&format=pdf",
      ),
    );
    expect(bad.status).toBe(400);

    const pdfRes = await guidesExportGet(
      new Request(
        `http://localhost/api/prestador/clinical-guides/export?type=atestado&id=${atestado!.id}&format=pdf&patientId=${joao.id}`,
      ),
    );
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers.get("cache-control")).toMatch(/no-store/i);
    const buffer = Buffer.from(await pdfRes.arrayBuffer());
    expect(buffer.subarray(0, 4).toString("utf8")).toBe("%PDF");
  });

  it("beneficiário lista guias e baixa PDF da receita multi-item quando existir", async () => {
    const prisma = getTestPrisma();
    const joao = await getDemoJoao();
    const receita = await prisma.prescriptionDocument.findFirst({
      where: { patientId: joao.id, status: "ATIVA" },
      orderBy: { createdAt: "desc" },
    });
    expect(receita).toBeTruthy();

    await setSessionForEmail("joao.pereira@email.com");

    const docsRes = await beneficiarioDocumentsGet();
    expect(docsRes.status).toBe(200);
    const docsBody = await docsRes.json();
    expect(Array.isArray(docsBody.documents)).toBe(true);
    expect(docsBody.documents.some((d: { kind: string }) => d.kind === "RECEITA")).toBe(true);

    const pdfRes = await beneficiarioGuidesExportGet(
      new Request(
        `http://localhost/api/beneficiario/clinical-guides/export?type=receita&id=${receita!.id}&format=pdf`,
      ),
    );
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers.get("content-type")).toBe("application/pdf");
    expect(pdfRes.headers.get("cache-control")).toMatch(/no-store/i);
    const buffer = Buffer.from(await pdfRes.arrayBuffer());
    expect(buffer.subarray(0, 4).toString("utf8")).toBe("%PDF");
  });
});
