export type LandingNavContext = "home" | "segment";

export type LandingNavItem = {
  href: string;
  label: string;
  external?: boolean;
};

/** Âncoras da home — funil de captação. */
export const HOME_NAV_ANCHORS: LandingNavItem[] = [
  { href: "#solucao", label: "Solução" },
  { href: "#roi", label: "ROI" },
  { href: "#para-quem", label: "Para quem" },
  { href: "#segmentos", label: "Segmentos" },
  { href: "#portais", label: "Portais" },
  { href: "#faq", label: "FAQ" },
];

/** Link para acesso segmentado (primeiro segmento como entrada). */
export const SEGMENT_ACCESS_HREF = "/segmentos/saude";

/** Rótulo do link de navegação para páginas de segmento (distinto da âncora #segmentos). */
export const SEGMENT_ACCESS_LABEL = "Acesso segmentado";

/** Âncoras da página de segmento. */
export const SEGMENT_NAV_ANCHORS: LandingNavItem[] = [
  { href: "#recursos", label: "Recursos" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#portais", label: "Portais" },
  { href: "#faq", label: "FAQ" },
];

export function landingNavItems(context: LandingNavContext): LandingNavItem[] {
  return context === "home" ? HOME_NAV_ANCHORS : SEGMENT_NAV_ANCHORS;
}
