import { NextResponse } from "next/server";
import { requireInternoModule, requireInternoModuleWrite, authErrorResponse } from "@/lib/api-auth";
import {
  createExamProtocolTemplate,
  listExamProtocolTemplates,
} from "@/lib/exam-protocol-service";
import type { ExamProtocolItem } from "@/lib/clinical/constants";

export async function GET() {
  try {
    const user = await requireInternoModule("cadastros");
    const templates = await listExamProtocolTemplates(user.tenantId, false);
    return NextResponse.json({ templates });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireInternoModuleWrite("cadastros");
    const body = (await request.json()) as {
      name?: string;
      specialty?: string;
      exams?: ExamProtocolItem[];
      clinicalIndication?: string;
    };

    if (!body.name?.trim() || !body.exams?.length) {
      return NextResponse.json(
        { error: "Informe nome e ao menos um exame no protocolo" },
        { status: 400 },
      );
    }

    const exams = body.exams
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

    const template = await createExamProtocolTemplate({
      tenantId: user.tenantId,
      name: body.name,
      specialty: body.specialty,
      exams,
      clinicalIndication: body.clinicalIndication,
    });

    return NextResponse.json({ template });
  } catch (error) {
    return authErrorResponse(error);
  }
}
