import type { PortalKey } from "@/lib/roles";
import {
  resolveBeneficiarioActive,
  resolveInternoActive,
  resolvePrestadorActive,
} from "@/lib/navigation/routes";

/** Escopo estável da rota para micro-tours (primeira visita por módulo). */
export function getRouteScopeKey(portal: PortalKey, pathname: string): string | null {
  if (portal === "interno") {
    if (/^\/interno\/beneficiarios\/[^/]+/.test(pathname)) return "cliente-360";
    return resolveInternoActive(pathname) ?? null;
  }
  if (portal === "prestador") {
    if (pathname.startsWith("/prestador/atendimento/")) return "atendimento";
    return resolvePrestadorActive(pathname) ?? null;
  }
  if (portal === "pj") {
    if (pathname.startsWith("/pj/projetos")) return "projetos";
    return "main";
  }
  if (portal === "beneficiario") {
    return resolveBeneficiarioActive(pathname) ?? null;
  }
  return null;
}

export function routeStorageKey(portal: PortalKey, scope: string): string {
  return `${portal}:${scope}`;
}
