import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { getVoaConfig } from "@/lib/voa/config";
import { importVoaDocumentToPep } from "@/lib/voa/import-record";

/** Importa documento gerado pela Voa para o PEP do atendimento. */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/prestador/appointments/[id]/voa/import">,
) {
  const prisma = await getPrisma();
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id: appointmentId } = await ctx.params;
    const config = getVoaConfig();

    if (!config.enabled) {
      return NextResponse.json(
        { error: "Integração Voa desabilitada (VOA_ENABLED=false)" },
        { status: 503 },
      );
    }

    const body = (await request.json()) as {
      patientId?: string;
      document?: string;
      templateName?: string | null;
      templateSlug?: string | null;
      recordType?: string | null;
      structuredOutput?: Record<string, unknown> | null;
    };

    if (!body.patientId || !body.document?.trim()) {
      return NextResponse.json(
        { error: "Informe paciente e conteúdo do documento" },
        { status: 400 },
      );
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        providerId: user.id,
        tenantId: user.tenantId,
        patientId: body.patientId,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Atendimento não encontrado" }, { status: 404 });
    }

    const result = await importVoaDocumentToPep({
      tenantId: user.tenantId,
      providerId: user.id,
      appointmentId,
      patientId: body.patientId,
      document: body.document,
      templateName: body.templateName,
      templateSlug: body.templateSlug,
      recordType: body.recordType,
      structuredOutput: body.structuredOutput,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
