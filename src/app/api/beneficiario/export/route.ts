import { NextResponse } from "next/server";
import { requireBeneficiary, authErrorResponse } from "@/lib/api-auth";
import {
  buildBeneficiarySectionTabularExport,
  type BeneficiaryExportSection,
} from "@/lib/exports/builders";
import { parseExportFormat } from "@/lib/exports/format";
import { buildPepRecordPdf } from "@/lib/exports/pep-service";
import { serveBufferExport, serveTabularExport } from "@/lib/exports/serve";
import { getTenantBranding } from "@/lib/theme/branding";

const VALID_SECTIONS = new Set<BeneficiaryExportSection>([
  "resumo",
  "consumo",
  "faturas",
  "historico",
  "prontuario",
  "assinatura",
]);

export async function GET(request: Request) {
  try {
    const user = await requireBeneficiary();
    const url = new URL(request.url);
    const format = parseExportFormat(url.searchParams.get("format"), "xlsx");
    const section = (url.searchParams.get("section") ?? "resumo") as BeneficiaryExportSection;
    const recordId = url.searchParams.get("recordId");

    if (recordId && format === "pdf") {
      const buffer = await buildPepRecordPdf(user.tenantId, [recordId], {
        patientId: user.patientId!,
      });
      if (!buffer) {
        return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
      }
      return serveBufferExport("pdf", `pep-${recordId.slice(0, 8)}`, buffer);
    }

    if (!VALID_SECTIONS.has(section)) {
      return NextResponse.json({ error: "Seção inválida" }, { status: 400 });
    }

    const data = await buildBeneficiarySectionTabularExport(
      user.patientId!,
      user.tenantId,
      section,
    );
    if (!data) {
      return NextResponse.json({ error: "Dados não encontrados" }, { status: 404 });
    }

    const branding = await getTenantBranding(user.tenantId);
    return serveTabularExport(format, `beneficiario-${section}`, data, {
      clinicName: branding.displayName,
      platformLabel: branding.platformLabel,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
