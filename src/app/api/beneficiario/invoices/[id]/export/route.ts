import { NextResponse } from "next/server";
import { requireBeneficiary, authErrorResponse } from "@/lib/api-auth";
import { buildInvoiceExportPdf } from "@/lib/exports/invoice-export";
import { buildInvoiceItemsTabularExport } from "@/lib/exports/builders";
import { parseExportFormat } from "@/lib/exports/format";
import { serveBufferExport, serveTabularExport } from "@/lib/exports/serve";
import { getTenantBranding } from "@/lib/theme/branding";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireBeneficiary();
    const { id } = await params;
    const format = parseExportFormat(new URL(request.url).searchParams.get("format"), "pdf");

    if (format === "pdf") {
      const buffer = await buildInvoiceExportPdf(user.tenantId, id, {
        patientId: user.patientId!,
      });
      if (!buffer) {
        return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });
      }
      return serveBufferExport("pdf", `fatura-${id.slice(0, 8)}`, buffer);
    }

    const data = await buildInvoiceItemsTabularExport(user.tenantId, id, {
      patientId: user.patientId!,
    });
    if (!data) {
      return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });
    }

    const branding = await getTenantBranding(user.tenantId);
    return serveTabularExport(format, `fatura-${id.slice(0, 8)}`, data, {
      clinicName: branding.displayName,
      platformLabel: branding.platformLabel,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
