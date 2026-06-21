import { NextResponse } from "next/server";
import { retryWebhookDelivery } from "@/lib/webhook-service";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireInternoModule("integracoes");
    const { id } = await params;

    const result = await retryWebhookDelivery(user.tenantId, id);
    if (!result) {
      return NextResponse.json({ error: "Entrega não encontrada" }, { status: 404 });
    }
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: "Retry executado" });
  } catch (error) {
    return authErrorResponse(error);
  }
}
