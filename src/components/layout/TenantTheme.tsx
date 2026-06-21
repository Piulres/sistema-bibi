import type { BrandingTokens } from "@/lib/theme/tokens";
import { brandingToCssVars, brandingThemeAttribute } from "@/lib/theme/css-vars";
import type { PortalKey } from "@/lib/roles";
import { portalAccentCssVars } from "@/lib/theme/portals";

type Props = {
  branding: BrandingTokens;
  portal?: PortalKey;
  className?: string;
  children: React.ReactNode;
};

/** Injeta CSS variables de branding (e opcionalmente do portal) no subtree. */
export default function TenantTheme({ branding, portal, className, children }: Props) {
  const style = {
    ...brandingToCssVars(branding),
    ...(portal ? portalAccentCssVars(portal) : {}),
  } as React.CSSProperties;

  return (
    <div
      className={className}
      data-theme={brandingThemeAttribute(branding)}
      style={style}
    >
      {children}
    </div>
  );
}
