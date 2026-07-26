import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { buildPepRecordPdf } from "@/lib/exports/pep-service";
import { parseExportFormat } from "@/lib/exports/format";
import { serveBufferExport } from "@/lib/exports/serve";

type Params = { params: Promise<{ id: string; recordId: string }> };

/** Exportação PEP customizada — apenas PDF do registro solicitado. */
export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireInternoModule("cadastros");
    const { id: patientId, recordId } = await params;
    const format = parseExportFormat(new URL(request.url).searchParams.get("format"), "pdf");

    if (format !== "pdf") {
      return NextResponse.json(
        { error: "Exportação de prontuário individual disponível apenas em PDF" },
        { status: 400 },
      );
    }

    const buffer = await buildPepRecordPdf(user.tenantId, [recordId], { patientId });
    if (!buffer) {
      return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
    }
    return serveBufferExport("pdf", `pep-${recordId.slice(0, 8)}`, buffer);
  } catch (error) {
    return authErrorResponse(error);
  }
}
