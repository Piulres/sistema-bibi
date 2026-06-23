import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { buildPepRecordPdf } from "@/lib/exports/pep-service";
import { parseExportFormat } from "@/lib/exports/format";
import { serveBufferExport } from "@/lib/exports/serve";

type Params = { params: Promise<{ id: string; recordId: string }> };

/** Exportação PEP customizada (PDF) ou tabular do registro. */
export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireInternoModule("cadastros");
    const { id: patientId, recordId } = await params;
    const format = parseExportFormat(new URL(request.url).searchParams.get("format"), "pdf");

    if (format === "pdf") {
      const buffer = await buildPepRecordPdf(user.tenantId, [recordId], { patientId });
      if (!buffer) {
        return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
      }
      return serveBufferExport("pdf", `pep-${recordId.slice(0, 8)}`, buffer);
    }

    const { buildPatientOverviewTabularExport } = await import("@/lib/exports/builders");
    const { serveTabularExport } = await import("@/lib/exports/serve");
    const { getTenantBranding } = await import("@/lib/theme/branding");

    const data = await buildPatientOverviewTabularExport(patientId, user.tenantId, "records");
    if (!data) {
      return NextResponse.json({ error: "Beneficiário não encontrado" }, { status: 404 });
    }

    const branding = await getTenantBranding(user.tenantId);
    return serveTabularExport(format, `prontuario-${recordId.slice(0, 8)}`, data, {
      clinicName: branding.displayName,
      platformLabel: branding.platformLabel,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
