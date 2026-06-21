import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "bibi_session";

/**
 * Checagem otimista de sessao (Next 16 "Proxy", antigo middleware).
 * Apenas verifica a presenca do cookie e redireciona para o login do
 * portal correspondente. A validacao real (assinatura + role) acontece
 * no servidor, em cada pagina/handler.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(COOKIE_NAME)?.value);

  const rules: { prefix: string; isLogin: (p: string) => boolean; loginPath: string }[] = [
    { prefix: "/prestador", isLogin: () => false, loginPath: "/login" },
    { prefix: "/interno", isLogin: (p) => p === "/interno/login", loginPath: "/interno/login" },
    { prefix: "/pj", isLogin: (p) => p === "/pj/login", loginPath: "/pj/login" },
  ];

  for (const rule of rules) {
    if (pathname.startsWith(rule.prefix) && !rule.isLogin(pathname)) {
      if (!hasSession) {
        const url = request.nextUrl.clone();
        url.pathname = rule.loginPath;
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/prestador/:path*", "/interno/:path*", "/pj/:path*"],
};
