import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { buildClinicFinanceMonthExport } from "@/lib/clinic-finance/service";
import { parseExportFormat } from "@/lib/exports/format";
import { serveTabularExport } from "@/lib/exports/serve";

export async function GET(request: Request) {
  try {
    const user = await requireInternoModule("gestao");
    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get("year") || undefined);
    const month = Number(searchParams.get("month") || undefined);
    const format = parseExportFormat(searchParams.get("format"), "xlsx");
    const data = await buildClinicFinanceMonthExport(
      user.tenantId,
      Number.isFinite(year) ? year : undefined,
      Number.isFinite(month) ? month : undefined,
    );
    // Stamp só com dígitos — title tem "07/2026" e `/` quebra Content-Disposition/download.
    const stampMatch = data.title.match(/(\d{2})\/(\d{4})$/);
    const stamp = stampMatch
      ? `${stampMatch[2]}-${stampMatch[1]}`
      : `${year || "export"}-${month || "mes"}`;
    return serveTabularExport(format, `gestao-clinica-${stamp}`, data, {
      clinicName: "Gestão clínica",
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
