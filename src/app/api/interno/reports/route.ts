import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import {
  buildBillingReportCsv,
  buildCrmReportCsv,
} from "@/lib/reports/billing-report";
import { buildBillingTabularExport, buildCrmTabularExport } from "@/lib/exports/builders";
import { parseExportFormat } from "@/lib/exports/format";
import { serveTabularExport } from "@/lib/exports/serve";
import { getTenantBranding } from "@/lib/theme/branding";

export async function GET(request: Request) {
  try {
    const user = await requireInternoModule("relatorios");
    const url = new URL(request.url);
    const type = url.searchParams.get("type") ?? "billing";
    const format = parseExportFormat(url.searchParams.get("format"), "csv");

    if (format === "csv") {
      const csv =
        type === "crm"
          ? await buildCrmReportCsv(user.tenantId)
          : await buildBillingReportCsv(user.tenantId);
      const filename = type === "crm" ? "crm-pipeline.csv" : "faturamento.csv";
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const data =
      type === "crm"
        ? await buildCrmTabularExport(user.tenantId)
        : await buildBillingTabularExport(user.tenantId);

    const branding = await getTenantBranding(user.tenantId);
    const filename = type === "crm" ? "crm-pipeline" : "faturamento";

    return serveTabularExport(format, filename, data, {
      clinicName: branding.displayName,
      platformLabel: branding.platformLabel,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
