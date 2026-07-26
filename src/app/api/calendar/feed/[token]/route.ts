import { NextResponse } from "next/server";
import { buildIcsForFeedToken } from "@/lib/calendar/calendar-feed-service";

/**
 * Feed ICS público (token opaco) — assinado por Google / Outlook / Apple.
 * Sem cookie de sessão: o segredo é o próprio token na URL.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/calendar/feed/[token]">,
) {
  const { token } = await ctx.params;
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Feed não encontrado" }, { status: 404 });
  }

  const built = await buildIcsForFeedToken(token);
  if (!built) {
    return NextResponse.json({ error: "Feed não encontrado" }, { status: 404 });
  }

  return new NextResponse(built.ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="bibi-agenda.ics"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
