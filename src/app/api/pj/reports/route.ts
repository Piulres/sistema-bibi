import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { buildPjTabularExport } from "@/lib/exports/builders";
import { buildPjReportCsv } from "@/lib/pj-portal-service";
import { parseExportFormat } from "@/lib/exports/format";
import { serveTabularExport } from "@/lib/exports/serve";
import { getTenantBranding } from "@/lib/theme/branding";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["PJ"]);
    if (!user.companyId) {
      return NextResponse.json({ error: "Usuário sem empresa vinculada" }, { status: 400 });
    }

    const format = parseExportFormat(new URL(request.url).searchParams.get("format"), "csv");

    if (format === "csv") {
      const csv = await buildPjReportCsv(user.companyId, user.tenantId);
      if (!csv) {
        return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
      }
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="bibi-pj-relatorio.csv"',
        },
      });
    }

    const data = await buildPjTabularExport(user.companyId, user.tenantId);
    if (!data) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const branding = await getTenantBranding(user.tenantId);
    return serveTabularExport(format, "bibi-pj-relatorio", data, {
      clinicName: branding.displayName,
      platformLabel: branding.platformLabel,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
