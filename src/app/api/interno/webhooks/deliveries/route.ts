import { NextResponse } from "next/server";
import { listWebhookDeliveries } from "@/lib/webhook-service";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";

export async function GET() {
  try {
    const user = await requireInternoModule("integracoes");
    const deliveries = await listWebhookDeliveries(user.tenantId);
    return NextResponse.json({ deliveries });
  } catch (error) {
    return authErrorResponse(error);
  }
}
