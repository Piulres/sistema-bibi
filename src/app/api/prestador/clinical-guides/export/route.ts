import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { parseExportFormat } from "@/lib/exports/format";
import { serveBufferExport } from "@/lib/exports/serve";
import {
  buildClinicalGuideExport,
  type ClinicalGuideExportType,
} from "@/lib/exports/clinical-guide-service";
import {
  recordTimelineEvent,
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "@/lib/timeline";

const GUIDE_TYPES = new Set([
  "receita",
  "exame",
  "encaminhamento",
  "atestado",
  "bundle",
]);

function entityForGuideType(type: string): string {
  switch (type) {
    case "receita":
      return TIMELINE_ENTITY_TYPES.PRESCRIPTION_DOCUMENT;
    case "exame":
      return TIMELINE_ENTITY_TYPES.EXAM_ORDER;
    case "encaminhamento":
      return TIMELINE_ENTITY_TYPES.CLINICAL_REFERRAL;
    case "atestado":
      return TIMELINE_ENTITY_TYPES.MEDICAL_RECORD;
    default:
      return TIMELINE_ENTITY_TYPES.APPOINTMENT;
  }
}

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

    const entityId = id ?? appointmentId ?? patientId ?? "bundle";
    await recordTimelineEvent({
      tenantId: user.tenantId,
      entityType: entityForGuideType(type),
      entityId,
      action: TIMELINE_ACTIONS.DOCUMENT_EXPORTED,
      description: `PDF de guia clínica exportado (${type})`,
      createdBy: user.id,
      metadata: {
        guideType: type,
        appointmentId: appointmentId ?? null,
        patientId: patientId ?? null,
      },
    });

    return serveBufferExport("pdf", result.filenameBase, result.buffer, {
      noStore: true,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
