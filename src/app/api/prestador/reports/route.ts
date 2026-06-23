import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import {
  buildPrestadorAppointmentsTabularExport,
  buildPrestadorProceduresTabularExport,
} from "@/lib/exports/builders";
import {
  buildPrestadorAppointmentsCsv,
  buildPrestadorProceduresCsv,
} from "@/lib/reports/prestador-report";
import { parseExportFormat } from "@/lib/exports/format";
import { serveTabularExport } from "@/lib/exports/serve";
import { getTenantBranding } from "@/lib/theme/branding";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const url = new URL(request.url);
    const type = url.searchParams.get("type") ?? "procedures";
    const from = url.searchParams.get("from") ?? undefined;
    const to = url.searchParams.get("to") ?? undefined;
    const format = parseExportFormat(url.searchParams.get("format"), "csv");

    if (format === "csv") {
      const csv =
        type === "appointments"
          ? await buildPrestadorAppointmentsCsv(user.tenantId, user.id, from, to)
          : await buildPrestadorProceduresCsv(user.tenantId, user.id, from, to);
      const filename =
        type === "appointments" ? "prestador-atendimentos.csv" : "prestador-procedimentos.csv";
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const data =
      type === "appointments"
        ? await buildPrestadorAppointmentsTabularExport(user.tenantId, user.id, from, to)
        : await buildPrestadorProceduresTabularExport(user.tenantId, user.id, from, to);

    const branding = await getTenantBranding(user.tenantId);
    const filename = type === "appointments" ? "prestador-atendimentos" : "prestador-procedimentos";

    return serveTabularExport(format, filename, data, {
      clinicName: branding.displayName,
      platformLabel: branding.platformLabel,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
