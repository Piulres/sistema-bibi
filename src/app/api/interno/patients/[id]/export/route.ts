import { NextResponse } from "next/server";
import { buildPatientLgpdExport } from "@/lib/patient-export";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import {
  buildPatientOverviewTabularExport,
  type PatientExportSection,
} from "@/lib/exports/builders";
import { parseExportFormat } from "@/lib/exports/format";
import { buildPepRecordPdf } from "@/lib/exports/pep-service";
import { serveBufferExport, serveTabularExport } from "@/lib/exports/serve";
import { getTenantBranding } from "@/lib/theme/branding";

type Params = { params: Promise<{ id: string }> };

const VALID_SECTIONS = new Set<PatientExportSection>([
  "timeline",
  "appointments",
  "usages",
  "records",
  "invoices",
  "summary",
]);

/** Exportação LGPD (JSON) ou seções do Cliente 360° em PDF/Excel. */
export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireInternoModule("cadastros");
    const { id } = await params;
    const url = new URL(request.url);
    const format = parseExportFormat(url.searchParams.get("format"), "json");
    const section = (url.searchParams.get("section") ?? "summary") as PatientExportSection;
    const recordId = url.searchParams.get("recordId");

    if (recordId && format === "pdf") {
      const buffer = await buildPepRecordPdf(user.tenantId, [recordId], { patientId: id });
      if (!buffer) {
        return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
      }
      return serveBufferExport("pdf", `pep-${recordId.slice(0, 8)}`, buffer);
    }

    if (format === "json" && !url.searchParams.get("section")) {
      const data = await buildPatientLgpdExport(user.tenantId, id);
      if (!data) {
        return NextResponse.json({ error: "Beneficiário não encontrado" }, { status: 404 });
      }
      const filename = `bibi-lgpd-${id.slice(0, 8)}.json`;
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (!VALID_SECTIONS.has(section)) {
      return NextResponse.json({ error: "Seção inválida" }, { status: 400 });
    }

    const data = await buildPatientOverviewTabularExport(id, user.tenantId, section);
    if (!data) {
      return NextResponse.json({ error: "Beneficiário não encontrado" }, { status: 404 });
    }

    const branding = await getTenantBranding(user.tenantId);
    const filename = `cliente360-${section}-${id.slice(0, 8)}`;
    return serveTabularExport(format, filename, data, {
      clinicName: branding.displayName,
      platformLabel: branding.platformLabel,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
