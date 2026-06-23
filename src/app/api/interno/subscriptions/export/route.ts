import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { buildSubscriptionsTabularExport } from "@/lib/exports/builders";
import { parseExportFormat } from "@/lib/exports/format";
import { serveTabularExport } from "@/lib/exports/serve";
import { getTenantBranding } from "@/lib/theme/branding";

export async function GET(request: Request) {
  try {
    const user = await requireInternoModule("subscriptions");
    const format = parseExportFormat(new URL(request.url).searchParams.get("format"), "xlsx");
    const data = await buildSubscriptionsTabularExport(user.tenantId);
    const branding = await getTenantBranding(user.tenantId);

    return serveTabularExport(format, "assinaturas", data, {
      clinicName: branding.displayName,
      platformLabel: branding.platformLabel,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
