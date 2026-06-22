import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { buildPepRecordPdf } from "@/lib/exports/pep-service";
import { parseExportFormat } from "@/lib/exports/format";
import { serveBufferExport } from "@/lib/exports/serve";

type Params = { params: Promise<{ recordId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { recordId } = await params;
    const format = parseExportFormat(new URL(request.url).searchParams.get("format"), "pdf");

    if (format !== "pdf") {
      return NextResponse.json(
        { error: "Registros clínicos só exportam em PDF customizado" },
        { status: 400 },
      );
    }

    const buffer = await buildPepRecordPdf(user.tenantId, [recordId], {
      providerId: user.id,
    });
    if (!buffer) {
      return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
    }

    return serveBufferExport("pdf", `pep-${recordId.slice(0, 8)}`, buffer);
  } catch (error) {
    return authErrorResponse(error);
  }
}
