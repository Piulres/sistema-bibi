import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { isCommunicationProviderConfigured } from "@/lib/communications/notification-service";
import {
  listMessages,
  listPatientsForMessaging,
  queueMessage,
} from "@/lib/message-service";
import { isCommunicationChannel, isMessageTemplate } from "@/lib/message";

export async function GET() {
  try {
    const user = await requireInternoModule("comunicacao");
    const messages = await listMessages(user.tenantId);
    const patients = await listPatientsForMessaging(user.tenantId);
    const providerConfigured = isCommunicationProviderConfigured()
      ? process.env.COMMUNICATION_PROVIDER?.trim() || "console (dev)"
      : null;

    return NextResponse.json({ messages, patients, providerConfigured });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("comunicacao");
    const body = (await request.json()) as {
      patientId?: string;
      channel?: string;
      template?: string;
      subject?: string | null;
      body?: string;
    };

    if (!body.patientId || !body.channel || !body.template || !body.body?.trim()) {
      return NextResponse.json(
        { error: "Informe beneficiário, canal, template e corpo da mensagem" },
        { status: 400 },
      );
    }

    if (!isCommunicationChannel(body.channel) || !isMessageTemplate(body.template)) {
      return NextResponse.json({ error: "Canal ou template inválido" }, { status: 400 });
    }

    const message = await queueMessage({
      tenantId: user.tenantId,
      patientId: body.patientId,
      channel: body.channel,
      template: body.template,
      subject: body.subject,
      body: body.body.trim(),
      createdBy: user.id,
    });

    if (!message) {
      return NextResponse.json({ error: "Beneficiário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ message });
  } catch (error) {
    return authErrorResponse(error);
  }
}
