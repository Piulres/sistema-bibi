import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as importGet, POST as importPost } from "@/app/api/interno/import/[entity]/route";
import { GET as convertGet, POST as convertPost } from "@/app/api/interno/import/convert/route";
import { jsonRequest } from "../helpers/request";
import {
  buildCompanyImportRow,
  buildImportContent,
  buildPatientImportRow,
  buildProcedureImportRow,
  generateValidCpf,
} from "../helpers/import-fixtures";
import { getTestPrisma } from "../helpers/db";
import {
  clearSessionMock,
  sessionMockState,
  setSessionForEmail,
} from "../helpers/session-mock";
import { parseInterchangeContent } from "@/lib/imports/interchange";
import { getImportColumns } from "@/lib/imports/schemas";

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

const entities = ["patients", "companies", "procedures"] as const;

function importUrl(entity: string, query = "") {
  return `http://localhost/api/interno/import/${entity}${query}`;
}

describe("API — importação interchange JSON/CSV", () => {
  afterEach(() => {
    clearSessionMock();
  });

  describe("autenticação e RBAC", () => {
    it("rejeita sem sessão", async () => {
      const res = await importGet(new Request(importUrl("patients")), {
        params: Promise.resolve({ entity: "patients" }),
      });
      expect(res.status).toBe(401);
    });

    it("rejeita perfil sem módulo cadastros", async () => {
      await setSessionForEmail("financeiro@bibi.health");
      const res = await importPost(
        jsonRequest(importUrl("patients"), {
          method: "POST",
          body: { content: "{}", format: "json", dryRun: true },
        }),
        { params: Promise.resolve({ entity: "patients" }) },
      );
      expect(res.status).toBe(403);
    });

    it("permite RECEPCAO importar", async () => {
      await setSessionForEmail("recepcao@bibi.health");
      const res = await importGet(
        new Request(importUrl("procedures", "?mode=template&format=json")),
        { params: Promise.resolve({ entity: "procedures" }) },
      );
      expect(res.status).toBe(200);
    });
  });

  describe("com ADMIN (cadastros)", () => {
    beforeEach(async () => {
      await setSessionForEmail("faturamento@bibi.health");
    });

    it.each(entities)("GET template %s em JSON e CSV", async (entity) => {
      for (const format of ["json", "csv"] as const) {
        const res = await importGet(
          new Request(importUrl(entity, `?mode=template&format=${format}`)),
          { params: Promise.resolve({ entity }) },
        );
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toContain(format === "json" ? "json" : "csv");
        const text = await res.text();
        expect(text.length).toBeGreaterThan(10);
        const parsed = parseInterchangeContent(text, format, entity, getImportColumns(entity));
        expect(parsed.ok).toBe(true);
      }
    });

    it.each(entities)("GET export %s em JSON e CSV", async (entity) => {
      for (const format of ["json", "csv"] as const) {
        const res = await importGet(
          new Request(importUrl(entity, `?mode=export&format=${format}`)),
          { params: Promise.resolve({ entity }) },
        );
        expect(res.status).toBe(200);
        const text = await res.text();
        const parsed = parseInterchangeContent(text, format, entity, getImportColumns(entity));
        expect(parsed.ok).toBe(true);
      }
    });

    it("rejeita entidade inválida", async () => {
      const res = await importGet(new Request(importUrl("invalid")), {
        params: Promise.resolve({ entity: "invalid" }),
      });
      expect(res.status).toBe(400);
    });

    it("rejeita conteúdo vazio no POST", async () => {
      const res = await importPost(
        jsonRequest(importUrl("patients"), {
          method: "POST",
          body: { content: "  ", format: "json" },
        }),
        { params: Promise.resolve({ entity: "patients" }) },
      );
      expect(res.status).toBe(400);
    });

    it("POST /import/convert converte CSV → JSON → CSV", async () => {
      const csv = buildImportContent("companies", [buildCompanyImportRow()], "csv");
      const toJson = await convertPost(
        jsonRequest("http://localhost/api/interno/import/convert", {
          method: "POST",
          body: { content: csv, from: "csv", to: "json", entity: "companies" },
        }),
      );
      expect(toJson.status).toBe(200);
      const jsonPayload = await toJson.json();
      expect(jsonPayload.rowCount).toBe(1);
      expect(jsonPayload.content).toContain('"entity": "companies"');

      const toCsv = await convertPost(
        jsonRequest("http://localhost/api/interno/import/convert", {
          method: "POST",
          body: {
            content: jsonPayload.content,
            from: "json",
            to: "csv",
            entity: "companies",
          },
        }),
      );
      expect(toCsv.status).toBe(200);
      const csvPayload = await toCsv.json();
      expect(csvPayload.content).toContain("razao_social");
    });

    it("GET /import/convert descreve o endpoint", async () => {
      const res = await convertGet();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.formats).toEqual(["json", "csv"]);
    });

    it("importa procedimento real via JSON", async () => {
      const row = buildProcedureImportRow();
      const content = buildImportContent("procedures", [row], "json");
      const res = await importPost(
        jsonRequest(importUrl("procedures"), {
          method: "POST",
          body: { content, format: "json", dryRun: false },
        }),
        { params: Promise.resolve({ entity: "procedures" }) },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(1);
      expect(body.errors).toBe(0);

      const prisma = getTestPrisma();
      const saved = await prisma.procedure.findFirst({
        where: { code: row.code },
      });
      expect(saved?.name).toBe(row.name);
    });

    it("importa empresa real via CSV", async () => {
      const row = buildCompanyImportRow();
      const content = buildImportContent("companies", [row], "csv");
      const res = await importPost(
        jsonRequest(importUrl("companies"), {
          method: "POST",
          body: { content, format: "csv", dryRun: false },
        }),
        { params: Promise.resolve({ entity: "companies" }) },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(1);

      const prisma = getTestPrisma();
      const saved = await prisma.company.findFirst({
        where: { cnpj: row.cnpj },
      });
      expect(saved?.name).toBe(row.name);
    });

    it("importa beneficiário real via JSON", async () => {
      const row = buildPatientImportRow();
      const content = buildImportContent("patients", [row], "json");
      const res = await importPost(
        jsonRequest(importUrl("patients"), {
          method: "POST",
          body: { content, format: "json", dryRun: false },
        }),
        { params: Promise.resolve({ entity: "patients" }) },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(1);

      const prisma = getTestPrisma();
      const saved = await prisma.patient.findFirst({
        where: { cpf: row.cpf },
      });
      expect(saved?.name).toBe(row.name);
    });

    it("dry-run ignora CPF duplicado já cadastrado", async () => {
      const row = buildPatientImportRow();
      const createContent = buildImportContent("patients", [row], "json");
      const createRes = await importPost(
        jsonRequest(importUrl("patients"), {
          method: "POST",
          body: { content: createContent, format: "json", dryRun: false },
        }),
        { params: Promise.resolve({ entity: "patients" }) },
      );
      expect(createRes.status).toBe(200);

      const duplicateContent = buildImportContent(
        "patients",
        [buildPatientImportRow({ cpf: row.cpf, name: "Duplicado Teste" })],
        "json",
      );
      const res = await importPost(
        jsonRequest(importUrl("patients"), {
          method: "POST",
          body: { content: duplicateContent, format: "json", dryRun: true },
        }),
        { params: Promise.resolve({ entity: "patients" }) },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.skipped).toBe(1);
      expect(body.created).toBe(0);
      expect(body.rows[0].status).toBe("skipped");
    });

    it("rejeita CPF inválido no lote", async () => {
      const content = buildImportContent(
        "patients",
        [buildPatientImportRow({ cpf: "111.111.111-11" })],
        "json",
      );
      const res = await importPost(
        jsonRequest(importUrl("patients"), {
          method: "POST",
          body: { content, format: "json", dryRun: true },
        }),
        { params: Promise.resolve({ entity: "patients" }) },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.errors).toBe(1);
      expect(body.rows[0].message).toContain("CPF inválido");
    });

    it("aceita upload multipart/form-data", async () => {
      const row = buildProcedureImportRow();
      const csv = buildImportContent("procedures", [row], "csv");
      const form = new FormData();
      form.set("format", "csv");
      form.set("dryRun", "true");
      form.set("content", csv);

      const res = await importPost(
        new Request(importUrl("procedures"), { method: "POST", body: form }),
        { params: Promise.resolve({ entity: "procedures" }) },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.dryRun).toBe(true);
    });

    it("round-trip export CSV → dry-run reimport", async () => {
      const uniqueCpf = generateValidCpf();
      const createRow = buildPatientImportRow({ cpf: uniqueCpf });
      const createContent = buildImportContent("patients", [createRow], "json");
      await importPost(
        jsonRequest(importUrl("patients"), {
          method: "POST",
          body: { content: createContent, format: "json" },
        }),
        { params: Promise.resolve({ entity: "patients" }) },
      );

      const exportRes = await importGet(
        new Request(importUrl("patients", "?mode=export&format=csv")),
        { params: Promise.resolve({ entity: "patients" }) },
      );
      const exportedCsv = await exportRes.text();
      expect(exportedCsv).toContain(uniqueCpf);

      const dryRunRes = await importPost(
        jsonRequest(importUrl("patients"), {
          method: "POST",
          body: { content: exportedCsv, format: "csv", dryRun: true },
        }),
        { params: Promise.resolve({ entity: "patients" }) },
      );
      const dryRunBody = await dryRunRes.json();
      expect(dryRunBody.skipped).toBeGreaterThanOrEqual(1);
    });
  });
});
