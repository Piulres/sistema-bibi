import { NextResponse } from "next/server";
import { deleteWebhook, toggleWebhook } from "@/lib/webhook-service";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireInternoModule("integracoes");
    const { id } = await params;
    const body = (await request.json()) as { active?: boolean };

    if (typeof body.active !== "boolean") {
      return NextResponse.json({ error: "Informe active: true/false" }, { status: 400 });
    }

    const result = await toggleWebhook(user.tenantId, id, body.active);
    if (!result) {
      return NextResponse.json({ error: "Webhook não encontrado" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireInternoModule("integracoes");
    const { id } = await params;

    const result = await deleteWebhook(user.tenantId, id);
    if (!result) {
      return NextResponse.json({ error: "Webhook não encontrado" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
