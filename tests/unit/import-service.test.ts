import { describe, expect, it } from "vitest";
import {
  buildImportExportDataset,
  buildImportTemplate,
  runImportBatch,
  serializeImportExport,
} from "@/lib/imports/import-service";
import { convertInterchangeContent, parseInterchangeContent } from "@/lib/imports/interchange";
import { getImportColumns, IMPORT_ENTITIES } from "@/lib/imports/schemas";
import { getPrisma } from "@/lib/db";
import {
  buildCompanyImportRow,
  buildImportContent,
  buildPatientImportRow,
  buildProcedureImportRow,
} from "../helpers/import-fixtures";

describe("imports.import-service", () => {
  it("gera template JSON e CSV para todas as entidades", () => {
    for (const entity of IMPORT_ENTITIES) {
      const json = buildImportTemplate(entity, "json");
      const csv = buildImportTemplate(entity, "csv");
      expect(json).toContain(`"entity": "${entity}"`);
      expect(csv.split("\n")[0]).toBeTruthy();
      const parsedJson = parseInterchangeContent(json, "json", entity, getImportColumns(entity));
      const parsedCsv = parseInterchangeContent(csv, "csv", entity, getImportColumns(entity));
      expect(parsedJson.ok).toBe(true);
      expect(parsedCsv.ok).toBe(true);
    }
  });

  it("exporta dataset com colunas canônicas", async () => {
    const tenant = await (await getPrisma()).tenant.findFirst();
    expect(tenant).toBeTruthy();
    if (!tenant) return;

    const dataset = await buildImportExportDataset(tenant.id, "patients");
    expect(dataset.entity).toBe("patients");
    expect(dataset.columns.length).toBeGreaterThan(3);
    expect(dataset.rows.length).toBeGreaterThan(0);

    const csv = await serializeImportExport(tenant.id, "patients", "csv");
    const parsed = parseInterchangeContent(csv, "csv", "patients", getImportColumns("patients"));
    expect(parsed.ok).toBe(true);
  });

  it("simula importação de empresa via CSV convertido para JSON", async () => {
    const tenant = await (await getPrisma()).tenant.findFirst();
    const admin = await (await getPrisma()).user.findFirst({
      where: { role: "INTERNO", internoProfile: "ADMIN" },
    });
    expect(tenant).toBeTruthy();
    expect(admin).toBeTruthy();
    if (!tenant || !admin) return;

    const template = buildImportTemplate("companies", "csv");
    const converted = convertInterchangeContent({
      content: template,
      from: "csv",
      to: "json",
      entity: "companies",
      columns: getImportColumns("companies"),
    });
    expect(converted.ok).toBe(true);
    if (!converted.ok || !converted.content) return;

    const result = await runImportBatch({
      tenantId: tenant.id,
      userId: admin.id,
      entity: "companies",
      format: "json",
      content: converted.content,
      dryRun: true,
    });

    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.dryRun).toBe(true);
    expect(result.total).toBeGreaterThan(0);
  });

  it("importa lote misto: 1 novo procedimento + 1 código duplicado", async () => {
    const tenant = await (await getPrisma()).tenant.findFirst();
    const admin = await (await getPrisma()).user.findFirst({
      where: { role: "INTERNO", internoProfile: "ADMIN" },
    });
    const existing = await (await getPrisma()).procedure.findFirst({
      where: { tenantId: tenant?.id },
    });
    expect(tenant && admin && existing).toBeTruthy();
    if (!tenant || !admin || !existing) return;

    const rows = [
      buildProcedureImportRow(),
      buildProcedureImportRow({ code: existing.code, name: "Duplicado" }),
    ];
    const content = buildImportContent("procedures", rows, "json");

    const result = await runImportBatch({
      tenantId: tenant.id,
      userId: admin.id,
      entity: "procedures",
      format: "json",
      content,
      dryRun: false,
    });

    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.created).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.errors).toBe(0);
  });

  it("valida data de nascimento em formato brasileiro", async () => {
    const tenant = await (await getPrisma()).tenant.findFirst();
    const admin = await (await getPrisma()).user.findFirst({
      where: { role: "INTERNO", internoProfile: "ADMIN" },
    });
    if (!tenant || !admin) return;

    const row = buildPatientImportRow({ birthDate: "15/05/1990" });
    const content = buildImportContent("patients", [row], "json");

    const result = await runImportBatch({
      tenantId: tenant.id,
      userId: admin.id,
      entity: "patients",
      format: "json",
      content,
      dryRun: true,
    });

    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.created).toBe(1);
  });

  it("rejeita payload com entidade divergente", async () => {
    const tenant = await (await getPrisma()).tenant.findFirst();
    const admin = await (await getPrisma()).user.findFirst({
      where: { role: "INTERNO", internoProfile: "ADMIN" },
    });
    if (!tenant || !admin) return;

    const wrongEntityJson = buildImportContent("companies", [buildCompanyImportRow()], "json").replace(
      '"entity": "companies"',
      '"entity": "patients"',
    );

    const result = await runImportBatch({
      tenantId: tenant.id,
      userId: admin.id,
      entity: "companies",
      format: "json",
      content: wrongEntityJson,
      dryRun: true,
    });

    expect(result).toEqual({ error: "Entidade esperada: companies, recebida: patients" });
  });
});
