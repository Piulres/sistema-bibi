import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { buildBillingTabularExport } from "@/lib/exports/builders";
import { parseExportFormat } from "@/lib/exports/format";
import { serveTabularExport } from "@/lib/exports/serve";
import { getTenantBranding } from "@/lib/theme/branding";

export async function GET(request: Request) {
  try {
    const user = await requireInternoModule("billing");
    const format = parseExportFormat(new URL(request.url).searchParams.get("format"), "xlsx");
    const data = await buildBillingTabularExport(user.tenantId);
    const branding = await getTenantBranding(user.tenantId);

    return serveTabularExport(format, "faturamento", data, {
      clinicName: branding.displayName,
      platformLabel: branding.platformLabel,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
