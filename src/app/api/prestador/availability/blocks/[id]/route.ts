import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { deleteBlockedTime } from "@/lib/availability/provider-availability-service";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/prestador/availability/blocks/[id]">,
) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id } = await ctx.params;
    const ok = await deleteBlockedTime({
      tenantId: user.tenantId,
      providerId: user.id,
      blockId: id,
    });
    if (!ok) {
      return NextResponse.json({ error: "Bloqueio não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
