import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  OAUTH_STATE_COOKIE,
  parseOAuthStateCookie,
  sanitizeReturnTo,
} from "@/lib/calendar/oauth-state";
import { getCalendarAdapter } from "@/lib/calendar/providers";
import {
  isCalendarProviderId,
  type CalendarProviderId,
} from "@/lib/calendar/providers/types";
import {
  oauthRedirectUri,
  upsertCalendarConnection,
} from "@/lib/calendar/calendar-connection-service";
import { getSiteUrl } from "@/lib/landing/site-url";

function parseProvider(raw: string): CalendarProviderId | null {
  const upper = raw.toUpperCase();
  return isCalendarProviderId(upper) ? upper : null;
}

function redirectWithMessage(returnTo: string, ok: boolean, message: string) {
  const url = new URL(sanitizeReturnTo(returnTo, "/prestador"), getSiteUrl());
  url.searchParams.set(ok ? "calendarConnected" : "calendarError", message);
  const res = NextResponse.redirect(url.toString());
  res.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

/** Callback OAuth — troca code por tokens e grava CalendarConnection. */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/calendar/oauth/[provider]/callback">,
) {
  const { provider: providerParam } = await ctx.params;
  const provider = parseProvider(providerParam);
  const url = new URL(request.url);

  if (!provider) {
    return redirectWithMessage("/prestador", false, "provedor_invalido");
  }

  const err = url.searchParams.get("error");
  if (err) {
    return redirectWithMessage("/prestador", false, err);
  }

  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const jar = await cookies();
  const cookieValue = jar.get(OAUTH_STATE_COOKIE)?.value;
  const state = parseOAuthStateCookie(cookieValue, stateParam);

  if (!state || state.provider !== provider) {
    return redirectWithMessage("/prestador", false, "estado_invalido");
  }

  if (!code) {
    return redirectWithMessage(state.returnTo, false, "codigo_ausente");
  }

  try {
    const adapter = getCalendarAdapter(provider);
    const tokens = await adapter.exchangeCode({
      code,
      redirectUri: oauthRedirectUri(provider),
    });
    await upsertCalendarConnection({
      tenantId: state.tenantId,
      userId: state.userId,
      scope: state.scope,
      provider,
      tokens,
    });
    return redirectWithMessage(state.returnTo, true, provider.toLowerCase());
  } catch (error) {
    console.error("[calendar-oauth] callback", error);
    return redirectWithMessage(state.returnTo, false, "troca_token_falhou");
  }
}
