import { NextResponse } from "next/server";
import {
  createWebhook,
  listWebhooks,
  WEBHOOK_EVENTS,
  isWebhookEvent,
} from "@/lib/webhook-service";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";

export async function GET() {
  try {
    const user = await requireInternoModule("integracoes");
    const webhooks = await listWebhooks(user.tenantId);
    return NextResponse.json({ webhooks, events: WEBHOOK_EVENTS });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("integracoes");
    const body = (await request.json()) as {
      label?: string;
      url?: string;
      secret?: string | null;
      events?: string[];
    };

    if (!body.label?.trim() || !body.url?.trim()) {
      return NextResponse.json({ error: "Informe rótulo e URL" }, { status: 400 });
    }

    const events = (body.events ?? []).filter(
      (e): e is (typeof WEBHOOK_EVENTS)[number] => typeof e === "string" && isWebhookEvent(e),
    );

    const result = await createWebhook({
      tenantId: user.tenantId,
      label: body.label,
      url: body.url,
      secret: body.secret,
      events,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
