import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { revokeCalendarConnection } from "@/lib/calendar/calendar-connection-service";
import {
  isCalendarProviderId,
  type CalendarProviderId,
} from "@/lib/calendar/providers/types";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/prestador/calendar/connections/[provider]">,
) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { provider: raw } = await ctx.params;
    const provider = raw.toUpperCase() as CalendarProviderId;
    if (!isCalendarProviderId(provider)) {
      return NextResponse.json({ error: "Provedor inválido" }, { status: 400 });
    }
    const revoked = await revokeCalendarConnection({
      tenantId: user.tenantId,
      userId: user.id,
      provider,
      scope: "PROVIDER",
    });
    return NextResponse.json({ ok: true, revoked });
  } catch (error) {
    return authErrorResponse(error);
  }
}
