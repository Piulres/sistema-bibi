import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { dispatchMessage } from "@/lib/message-service";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/interno/messages/[id]/dispatch">,
) {
  try {
    const user = await requireUser(["INTERNO"]);
    const { id } = await ctx.params;

    const result = await dispatchMessage({
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
