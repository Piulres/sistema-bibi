import { NextResponse } from "next/server";
import { requireUser, authErrorResponse, ApiAuthError } from "@/lib/api-auth";
import { isCalendarFeedScope } from "@/lib/calendar/calendar-feed-service";
import {
  createOAuthStateCookie,
  OAUTH_STATE_COOKIE,
  sanitizeReturnTo,
} from "@/lib/calendar/oauth-state";
import {
  getCalendarAdapter,
  isCalendarOAuthMock,
} from "@/lib/calendar/providers";
import {
  isCalendarProviderId,
  type CalendarProviderId,
} from "@/lib/calendar/providers/types";
import { oauthRedirectUri } from "@/lib/calendar/calendar-connection-service";
import { sessionCookieOptions } from "@/lib/security/config";

function parseProvider(raw: string): CalendarProviderId | null {
  const upper = raw.toUpperCase();
  return isCalendarProviderId(upper) ? upper : null;
}

/** Inicia OAuth Google/Microsoft — redireciona ao provedor. */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/calendar/oauth/[provider]/start">,
) {
  try {
    const { provider: providerParam } = await ctx.params;
    const provider = parseProvider(providerParam);
    if (!provider) {
      return NextResponse.json({ error: "Provedor inválido" }, { status: 400 });
    }

    const url = new URL(request.url);
    const scopeRaw = url.searchParams.get("scope") ?? "PROVIDER";
    if (!isCalendarFeedScope(scopeRaw)) {
      return NextResponse.json({ error: "Escopo inválido" }, { status: 400 });
    }

    const roles =
      scopeRaw === "TENANT" ? (["INTERNO"] as const) : (["PRESTADOR", "INTERNO"] as const);
    const user = await requireUser([...roles]);

    if (scopeRaw === "PROVIDER" && user.role !== "PRESTADOR") {
      throw new ApiAuthError(403, "Somente prestador conecta agenda PROVIDER");
    }
    if (scopeRaw === "TENANT" && user.role !== "INTERNO") {
      throw new ApiAuthError(403, "Somente interno conecta agenda da operação");
    }

    const adapter = getCalendarAdapter(provider);
    if (!adapter.isConfigured() && !isCalendarOAuthMock()) {
      return NextResponse.json(
        {
          error:
            "Provedor não configurado. Defina as variáveis de ambiente do cliente OAuth (ver docs/plataforma/CALENDAR_INTEGRATION.md).",
        },
        { status: 503 },
      );
    }

    const returnTo = sanitizeReturnTo(
      url.searchParams.get("returnTo"),
      scopeRaw === "TENANT" ? "/interno/agenda" : "/prestador",
    );

    const { cookieValue, stateParam } = createOAuthStateCookie({
      provider,
      scope: scopeRaw,
      userId: user.id,
      tenantId: user.tenantId,
      returnTo,
    });

    const redirectUri = oauthRedirectUri(provider);
    const authUrl = adapter.buildAuthUrl({
      state: stateParam,
      redirectUri,
    });

    const response = NextResponse.redirect(authUrl);
    response.cookies.set(OAUTH_STATE_COOKIE, cookieValue, {
      ...sessionCookieOptions(),
      maxAge: 10 * 60,
    });
    return response;
  } catch (error) {
    return authErrorResponse(error);
  }
}
