import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/security/session-token";

/**
 * Checagem de sessão no proxy (Next 16).
 * Valida presença e assinatura HMAC do cookie; redireciona para login se inválido.
 * A validação de role acontece no servidor, em cada página/handler.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const hasValidSession = Boolean(verifySessionToken(rawToken));

  const rules: { prefix: string; isLogin: (p: string) => boolean; loginPath: string }[] = [
    { prefix: "/prestador", isLogin: () => false, loginPath: "/login" },
    { prefix: "/interno", isLogin: (p) => p === "/interno/login", loginPath: "/interno/login" },
    { prefix: "/pj", isLogin: (p) => p === "/pj/login", loginPath: "/pj/login" },
    {
      prefix: "/beneficiario",
      isLogin: (p) => p === "/beneficiario/login",
      loginPath: "/beneficiario/login",
    },
  ];

  for (const rule of rules) {
    if (pathname.startsWith(rule.prefix) && !rule.isLogin(pathname)) {
      if (!hasValidSession) {
        const url = request.nextUrl.clone();
        url.pathname = rule.loginPath;
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/prestador/:path*",
    "/interno/:path*",
    "/pj/:path*",
    "/beneficiario/:path*",
  ],
};
