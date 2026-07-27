import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { parseExportFormat } from "@/lib/exports/format";
import { buildAuditTabularExport } from "@/lib/exports/builders";
import { serveTabularExport } from "@/lib/exports/serve";
import { getTenantBranding } from "@/lib/theme/branding";
import { endOfDayInAppTz, startOfDayInAppTz } from "@/lib/timezone";

export async function GET(request: Request) {
  try {
    const user = await requireInternoModule("auditoria");
    const url = new URL(request.url);
    const format = parseExportFormat(url.searchParams.get("format"), "xlsx");

    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");

    const data = await buildAuditTabularExport(
      user.tenantId,
      {
        entityType: url.searchParams.get("entityType") ?? undefined,
        action: url.searchParams.get("action") ?? undefined,
        search: url.searchParams.get("search") ?? undefined,
        from: fromParam ? startOfDayInAppTz(fromParam) : undefined,
        to: toParam ? endOfDayInAppTz(toParam) : undefined,
      },
      { role: user.role, internoProfile: user.internoProfile },
    );

    const branding = await getTenantBranding(user.tenantId);
    return serveTabularExport(format, "auditoria", data, {
      clinicName: branding.displayName,
      platformLabel: branding.platformLabel,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
