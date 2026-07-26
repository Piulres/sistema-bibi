import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import {
  ensureCalendarFeed,
  getActiveCalendarFeed,
  revokeCalendarFeed,
} from "@/lib/calendar/calendar-feed-service";

/** Status do feed ICS do prestador logado. */
export async function GET() {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const feed = await getActiveCalendarFeed({
      tenantId: user.tenantId,
      scope: "PROVIDER",
      userId: user.id,
    });
    return NextResponse.json({ feed });
  } catch (error) {
    return authErrorResponse(error);
  }
}

/** Cria ou rotaciona o feed ICS pessoal do prestador. */
export async function POST(request: Request) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const body = (await request.json().catch(() => ({}))) as {
      rotate?: boolean;
      label?: string;
    };
    const feed = await ensureCalendarFeed({
      tenantId: user.tenantId,
      scope: "PROVIDER",
      userId: user.id,
      label: body.label,
      rotate: Boolean(body.rotate),
    });
    return NextResponse.json({ feed });
  } catch (error) {
    return authErrorResponse(error);
  }
}

/** Revoga o feed ativo (URL deixa de funcionar). */
export async function DELETE() {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const feed = await getActiveCalendarFeed({
      tenantId: user.tenantId,
      scope: "PROVIDER",
      userId: user.id,
    });
    if (!feed) {
      return NextResponse.json({ ok: true, revoked: false });
    }
    const revoked = await revokeCalendarFeed({
      tenantId: user.tenantId,
      feedId: feed.id,
      userId: user.id,
    });
    return NextResponse.json({ ok: true, revoked });
  } catch (error) {
    return authErrorResponse(error);
  }
}
