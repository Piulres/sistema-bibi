import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
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
