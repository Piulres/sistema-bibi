import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { buildTemplateBody } from "@/lib/message-service";
import { isMessageTemplate } from "@/lib/message";
import { getPrisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";

/** Sugere assunto/corpo para templates de comunicacao. */
export async function GET(request: Request) {
  const prisma = await getPrisma();
  try {
    const user = await requireUser(["INTERNO"]);
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const template = searchParams.get("template");

    if (!patientId || !template || !isMessageTemplate(template)) {
      return NextResponse.json({ error: "Informe patientId e template válido" }, { status: 400 });
    }

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId: user.tenantId },
      include: {
        appointments: {
          where: { status: { in: ["AGENDADO", "CONFIRMADO"] } },
          orderBy: { scheduledAt: "asc" },
          take: 1,
        },
        subscriptions: {
          where: { status: "ATIVA" },
          include: { charges: { where: { status: "PENDENTE" }, orderBy: { dueDate: "asc" }, take: 1 } },
          take: 1,
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Beneficiário não encontrado" }, { status: 404 });
    }

    const nextAppointment = patient.appointments[0];
    const pendingUsages = await prisma.procedureUsage.findMany({
      where: {
        billed: false,
        appointment: { patientId: patient.id },
      },
    });
    const pendingAmount = pendingUsages.reduce((sum, u) => sum + u.priceCharged, 0);
    const nextCharge = patient.subscriptions[0]?.charges[0];

    const suggestion = buildTemplateBody({
      template,
      patientName: patient.name,
      amountLabel: formatBRL(
        template === "INVOICE_DUE" ? pendingAmount : (nextCharge?.amount ?? 0),
      ),
      appointmentDateLabel: nextAppointment
        ? nextAppointment.scheduledAt.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : undefined,
    });

    return NextResponse.json({ suggestion });
  } catch (error) {
    return authErrorResponse(error);
  }
}
