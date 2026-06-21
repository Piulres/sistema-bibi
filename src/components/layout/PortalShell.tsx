import type { BrandingTokens } from "@/lib/theme/tokens";
import type { PortalKey } from "@/lib/roles";
import TenantTheme from "@/components/layout/TenantTheme";
import PortalHeader from "@/components/PortalHeader";

type Props = {
  portal: PortalKey;
  portalLabel: string;
  loginPath: string;
  userName: string;
  branding: BrandingTokens;
  children: React.ReactNode;
};

/** Shell padrao dos portais autenticados — header, tema e area principal. */
export default function PortalShell({
  portal,
  portalLabel,
  loginPath,
  userName,
  branding,
  children,
}: Props) {
  return (
    <TenantTheme branding={branding} portal={portal} className="flex flex-1 flex-col">
      <PortalHeader
        portalLabel={portalLabel}
        displayName={branding.displayName}
        logoUrl={branding.logoUrl}
        userName={userName}
        loginPath={loginPath}
        platformLabel={branding.platformLabel}
      />
      <main className="ds-page-shell">{children}</main>
    </TenantTheme>
  );
}
