import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { parseExportFormat } from "@/lib/exports/format";
import { serveBufferExport } from "@/lib/exports/serve";
import {
  buildClinicalGuideExport,
  type ClinicalGuideExportType,
} from "@/lib/exports/clinical-guide-service";

const GUIDE_TYPES = new Set([
  "receita",
  "exame",
  "encaminhamento",
  "atestado",
  "bundle",
]);

export async function GET(request: Request) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { searchParams } = new URL(request.url);
    const format = parseExportFormat(searchParams.get("format"), "pdf");
    const type = searchParams.get("type") ?? "";
    const id = searchParams.get("id");
    const appointmentId = searchParams.get("appointmentId");
    const patientId = searchParams.get("patientId");

    if (format !== "pdf") {
      return NextResponse.json(
        { error: "Guias clínicas só exportam em PDF" },
        { status: 400 },
      );
    }

    if (!GUIDE_TYPES.has(type)) {
      return NextResponse.json(
        {
          error:
            "type inválido — use receita | exame | encaminhamento | atestado | bundle",
        },
        { status: 400 },
      );
    }

    const result = await buildClinicalGuideExport({
      tenantId: user.tenantId,
      type: type as ClinicalGuideExportType,
      id,
      appointmentId,
      // Prestador imprime guias do atendimento no tenant — sem filtrar por prescritor.
      patientId: patientId ?? undefined,
    });

    if (!result) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
    }

    return serveBufferExport("pdf", result.filenameBase, result.buffer);
  } catch (error) {
    return authErrorResponse(error);
  }
}
