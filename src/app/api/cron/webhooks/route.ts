import { NextResponse } from "next/server";
import { processWebhookRetries } from "@/lib/webhook-service";
import { isValidCronSecret } from "@/lib/security/cron-auth";

/** Job agendado para reprocessar webhooks pendentes. Header: x-cron-secret */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret?.trim()) {
    return NextResponse.json({ error: "CRON_SECRET não configurado" }, { status: 503 });
  }

  const header = request.headers.get("x-cron-secret");
  if (!isValidCronSecret(header, secret)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const result = await processWebhookRetries();
  return NextResponse.json(result);
}
