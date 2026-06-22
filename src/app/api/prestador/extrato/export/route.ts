import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { buildExtratoTabularExport } from "@/lib/exports/builders";
import { parseExportFormat } from "@/lib/exports/format";
import { serveTabularExport } from "@/lib/exports/serve";
import { getTenantBranding } from "@/lib/theme/branding";

export async function GET(request: Request) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const url = new URL(request.url);
    const format = parseExportFormat(url.searchParams.get("format"), "xlsx");
    const from = url.searchParams.get("from") ?? undefined;
    const to = url.searchParams.get("to") ?? undefined;

    const data = await buildExtratoTabularExport(user.tenantId, user.id, from, to);
    const branding = await getTenantBranding(user.tenantId);

    return serveTabularExport(format, "extrato-prestador", data, {
      clinicName: branding.displayName,
      platformLabel: branding.platformLabel,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
