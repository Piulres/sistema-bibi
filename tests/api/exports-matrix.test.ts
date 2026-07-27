import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as auditExportGet } from "@/app/api/interno/audit/export/route";
import { GET as billingExportGet } from "@/app/api/interno/billing/export/route";
import { GET as subscriptionsExportGet } from "@/app/api/interno/subscriptions/export/route";
import { GET as internoReportsGet } from "@/app/api/interno/reports/route";
import { GET as clinicFinanceExportGet } from "@/app/api/interno/clinic-finance/export/route";
import { GET as patientExportGet } from "@/app/api/interno/patients/[id]/export/route";
import { GET as prestadorExtratoExportGet } from "@/app/api/prestador/extrato/export/route";
import { GET as prestadorReportsGet } from "@/app/api/prestador/reports/route";
import { GET as prestadorPatientExportGet } from "@/app/api/prestador/patients/[id]/export/route";
import { GET as beneficiarioExportGet } from "@/app/api/beneficiario/export/route";
import { GET as pjReportsGet } from "@/app/api/pj/reports/route";
import { EXPORT_FORMATS, type ExportFormat } from "@/lib/exports/format";
import { getDemoJoao } from "../helpers/seed-fixtures";
import { clearSessionMock, sessionMockState, setSessionForEmail } from "../helpers/session-mock";

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

async function expectOk(res: Response, label: string) {
  if (res.status !== 200) {
    const body = await res.text();
    throw new Error(`${label}: HTTP ${res.status} — ${body.slice(0, 200)}`);
  }
  expect(res.status).toBe(200);
}

describe("API — matriz completa de exportações", () => {
  afterEach(() => {
    clearSessionMock();
  });

  describe("Interno", () => {
    beforeEach(async () => {
      await setSessionForEmail("faturamento@bibi.health");
    });

    it.each(EXPORT_FORMATS)("audit/export?format=%s", async (format) => {
      const res = await auditExportGet(
        new Request(`http://localhost/api/interno/audit/export?format=${format}`),
      );
      await expectOk(res, `audit/${format}`);
    });

    it.each(EXPORT_FORMATS)("billing/export?format=%s", async (format) => {
      const res = await billingExportGet(
        new Request(`http://localhost/api/interno/billing/export?format=${format}`),
      );
      await expectOk(res, `billing/${format}`);
    });

    it.each(EXPORT_FORMATS)("subscriptions/export?format=%s", async (format) => {
      const res = await subscriptionsExportGet(
        new Request(`http://localhost/api/interno/subscriptions/export?format=${format}`),
      );
      await expectOk(res, `subscriptions/${format}`);
    });

    it.each(EXPORT_FORMATS)("reports billing?format=%s", async (format) => {
      const res = await internoReportsGet(
        new Request(`http://localhost/api/interno/reports?type=billing&format=${format}`),
      );
      await expectOk(res, `reports-billing/${format}`);
    });

    it.each(EXPORT_FORMATS)("reports crm?format=%s", async (format) => {
      const res = await internoReportsGet(
        new Request(`http://localhost/api/interno/reports?type=crm&format=${format}`),
      );
      await expectOk(res, `reports-crm/${format}`);
    });

    it.each(EXPORT_FORMATS)("clinic-finance/export?format=%s", async (format) => {
      const res = await clinicFinanceExportGet(
        new Request(`http://localhost/api/interno/clinic-finance/export?format=${format}`),
      );
      await expectOk(res, `clinic-finance/${format}`);
    });

    it("clinic-finance: Content-Disposition sem barra (evita Chrome 'site indisponível')", async () => {
      const res = await clinicFinanceExportGet(
        new Request(
          "http://localhost/api/interno/clinic-finance/export?year=2026&month=7&format=pdf",
        ),
      );
      await expectOk(res, "clinic-finance/pdf-filename");
      const disposition = res.headers.get("content-disposition") ?? "";
      expect(disposition).toMatch(/attachment/i);
      expect(disposition).not.toMatch(/07\/2026/);
      expect(disposition).toMatch(/gestao-clinica-2026-07\.pdf/);
      const buf = Buffer.from(await res.arrayBuffer());
      expect(buf.byteLength).toBeGreaterThan(100);
    });

    it.each([
      "timeline",
      "appointments",
      "usages",
      "records",
      "invoices",
      "summary",
    ] as const)("patient export section=%s em todos os formatos", async (section) => {
      const joao = await getDemoJoao();
      for (const format of EXPORT_FORMATS) {
        const res = await patientExportGet(
          new Request(
            `http://localhost/api/interno/patients/${joao.id}/export?section=${section}&format=${format}`,
          ),
          { params: Promise.resolve({ id: joao.id }) },
        );
        await expectOk(res, `patient-${section}/${format}`);
      }
    });
  });

  describe("Prestador", () => {
    beforeEach(async () => {
      await setSessionForEmail("dra.helena@bibi.health");
    });

    it.each(EXPORT_FORMATS)("extrato/export?format=%s", async (format) => {
      const res = await prestadorExtratoExportGet(
        new Request(`http://localhost/api/prestador/extrato/export?format=${format}`),
      );
      await expectOk(res, `extrato/${format}`);
    });

    it.each(["procedures", "appointments"] as const)(
      "reports type=%s em todos os formatos",
      async (type) => {
        for (const format of EXPORT_FORMATS) {
          const res = await prestadorReportsGet(
            new Request(
              `http://localhost/api/prestador/reports?type=${type}&format=${format}`,
            ),
          );
          await expectOk(res, `reports-${type}/${format}`);
        }
      },
    );

    it.each(["summary", "appointments", "usages", "records", "timeline"] as const)(
      "patient export section=%s",
      async (section) => {
        const joao = await getDemoJoao();
        for (const format of EXPORT_FORMATS) {
          const res = await prestadorPatientExportGet(
            new Request(
              `http://localhost/api/prestador/patients/${joao.id}/export?section=${section}&format=${format}`,
            ),
            { params: Promise.resolve({ id: joao.id }) },
          );
          await expectOk(res, `patient-${section}/${format}`);
        }
      },
    );
  });

  describe("Beneficiário", () => {
    beforeEach(async () => {
      await setSessionForEmail("joao.pereira@email.com");
    });

    it.each([
      "resumo",
      "agenda",
      "consumo",
      "faturas",
      "historico",
      "prontuario",
      "assinatura",
    ] as const)("export section=%s em todos os formatos", async (section) => {
      for (const format of EXPORT_FORMATS) {
        const res = await beneficiarioExportGet(
          new Request(
            `http://localhost/api/beneficiario/export?section=${section}&format=${format}`,
          ),
        );
        await expectOk(res, `beneficiario-${section}/${format}`);
      }
    });
  });

  describe("PJ", () => {
    beforeEach(async () => {
      await setSessionForEmail("rh@techcorp.com");
    });

    it.each(EXPORT_FORMATS)("reports?format=%s", async (format: ExportFormat) => {
      const res = await pjReportsGet(
        new Request(`http://localhost/api/pj/reports?format=${format}`),
      );
      await expectOk(res, `pj/${format}`);
    });
  });
});
