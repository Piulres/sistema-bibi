import { NextResponse } from "next/server";
import {
  requireInternoModule,
  requireInternoModuleWrite,
  authErrorResponse,
} from "@/lib/api-auth";
import {
  ensureCalendarFeed,
  getActiveCalendarFeed,
  revokeCalendarFeed,
} from "@/lib/calendar/calendar-feed-service";
import {
  listCalendarConnections,
  oauthStartPath,
} from "@/lib/calendar/calendar-connection-service";

/** Feed ICS + conexões OAuth da operação. */
export async function GET() {
  try {
    const user = await requireInternoModule("agenda");
    const feed = await getActiveCalendarFeed({
      tenantId: user.tenantId,
      scope: "TENANT",
    });
    const { connections, providers } = await listCalendarConnections({
      tenantId: user.tenantId,
      userId: user.id,
      scope: "TENANT",
    });
    return NextResponse.json({
      feed,
      connections,
      providers,
      oauth: {
        googleStart: oauthStartPath("GOOGLE", "TENANT", "/interno/agenda"),
        microsoftStart: oauthStartPath("MICROSOFT", "TENANT", "/interno/agenda"),
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireInternoModuleWrite("agenda");
    const body = (await request.json().catch(() => ({}))) as {
      rotate?: boolean;
      label?: string;
    };
    const feed = await ensureCalendarFeed({
      tenantId: user.tenantId,
      scope: "TENANT",
      label: body.label,
      rotate: Boolean(body.rotate),
    });
    return NextResponse.json({ feed });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE() {
  try {
    const user = await requireInternoModuleWrite("agenda");
    const feed = await getActiveCalendarFeed({
      tenantId: user.tenantId,
      scope: "TENANT",
    });
    if (!feed) {
      return NextResponse.json({ ok: true, revoked: false });
    }
    const revoked = await revokeCalendarFeed({
      tenantId: user.tenantId,
      feedId: feed.id,
    });
    return NextResponse.json({ ok: true, revoked });
  } catch (error) {
    return authErrorResponse(error);
  }
}
