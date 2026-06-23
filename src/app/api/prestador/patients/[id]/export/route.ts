import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import {
  buildProviderPatientTabularExport,
  type ProviderPatientExportSection,
} from "@/lib/exports/builders";
import { parseExportFormat } from "@/lib/exports/format";
import { serveTabularExport } from "@/lib/exports/serve";
import { getTenantBranding } from "@/lib/theme/branding";

type Params = { params: Promise<{ id: string }> };

const VALID_SECTIONS = new Set<ProviderPatientExportSection>([
  "summary",
  "appointments",
  "usages",
  "records",
  "timeline",
]);

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id } = await params;
    const url = new URL(request.url);
    const format = parseExportFormat(url.searchParams.get("format"), "xlsx");
    const section = (url.searchParams.get("section") ?? "summary") as ProviderPatientExportSection;

    if (!VALID_SECTIONS.has(section)) {
      return NextResponse.json({ error: "Seção inválida" }, { status: 400 });
    }

    const data = await buildProviderPatientTabularExport(
      id,
      user.id,
      user.tenantId,
      section,
    );
    if (!data) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    const branding = await getTenantBranding(user.tenantId);
    return serveTabularExport(format, `paciente-${section}-${id.slice(0, 8)}`, data, {
      clinicName: branding.displayName,
      platformLabel: branding.platformLabel,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
