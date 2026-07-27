import { NextResponse } from "next/server";
import { requireInternoModuleWrite, authErrorResponse } from "@/lib/api-auth";
import { updateExamProtocolTemplate } from "@/lib/exam-protocol-service";
import type { ExamProtocolItem } from "@/lib/clinical/constants";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await requireInternoModuleWrite("cadastros");
    const { id } = await params;
    const body = (await request.json()) as {
      name?: string;
      specialty?: string;
      exams?: ExamProtocolItem[];
      clinicalIndication?: string | null;
      active?: boolean;
    };

    let exams: ExamProtocolItem[] | undefined;
    if (body.exams !== undefined) {
      exams = body.exams
        .map((item, index) => ({
          id: item.id?.trim() || `exam-${index + 1}`,
          examName: item.examName?.trim() ?? "",
          procedureId: item.procedureId ?? null,
        }))
        .filter((item) => item.examName.length > 0);
      if (exams.length === 0) {
        return NextResponse.json(
          { error: "Informe ao menos um nome de exame" },
          { status: 400 },
        );
      }
    }

    const template = await updateExamProtocolTemplate({
      id,
      tenantId: user.tenantId,
      name: body.name,
      specialty: body.specialty,
      exams,
      clinicalIndication: body.clinicalIndication,
      active: body.active,
    });

    if (!template) {
      return NextResponse.json(
        { error: "Protocolo de exames não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    return authErrorResponse(error);
  }
}
