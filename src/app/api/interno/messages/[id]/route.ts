import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { cancelMessage } from "@/lib/message-service";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/interno/messages/[id]">,
) {
  try {
    const user = await requireUser(["INTERNO"]);
    const { id } = await ctx.params;
    const body = (await request.json()) as { action?: string };

    if (body.action !== "cancel") {
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }

    const result = await cancelMessage({
      tenantId: user.tenantId,
      messageId: id,
      createdBy: user.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Mensagem não encontrada" }, { status: 404 });
    }
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
