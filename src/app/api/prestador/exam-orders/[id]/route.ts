import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { updateExamOrder } from "@/lib/exam-order-service";
import { EXAM_ORDER_STATUSES, type ExamOrderStatus } from "@/lib/clinical/constants";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const prisma = await getPrisma();
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id } = await params;
    const body = (await request.json()) as {
      status?: string;
      scheduledAt?: string | null;
      resultSummary?: string | null;
      markReviewed?: boolean;
    };

    if (body.status && !EXAM_ORDER_STATUSES.includes(body.status as ExamOrderStatus)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const existing = await prisma.examOrder.findFirst({
      where: { id, patient: { tenantId: user.tenantId } },
      include: { patient: { select: { name: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Pedido de exame não encontrado" }, { status: 404 });
    }

    const examOrder = await updateExamOrder({
      id,
      tenantId: user.tenantId,
      providerId: user.id,
      patientName: existing.patient.name,
      status: body.status as ExamOrderStatus | undefined,
      scheduledAt: body.scheduledAt,
      resultSummary: body.resultSummary,
      markReviewed: body.markReviewed,
    });

    return NextResponse.json({ examOrder });
  } catch (error) {
    return authErrorResponse(error);
  }
}
