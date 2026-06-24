import { describe, expect, it } from "vitest";
import { buildImportTemplate, runImportBatch } from "@/lib/imports/import-service";
import { convertInterchangeContent } from "@/lib/imports/interchange";
import { getImportColumns } from "@/lib/imports/schemas";
import { getPrisma } from "@/lib/db";

describe("imports.import-service", () => {
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
});
