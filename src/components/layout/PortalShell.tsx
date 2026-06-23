import type { BrandingTokens } from "@/lib/theme/tokens";
import type { PortalKey } from "@/lib/roles";
import type { NicheId, NicheLabels } from "@/lib/niche/types";
import TenantTheme from "@/components/layout/TenantTheme";
import PortalHeader from "@/components/PortalHeader";
import { NicheProvider } from "@/hooks/useNiche";

type Props = {
  portal: PortalKey;
  portalLabel: string;
  loginPath: string;
  userName: string;
  branding: BrandingTokens;
  niche: NicheId;
  labels: NicheLabels;
  children: React.ReactNode;
};

/** Shell padrao dos portais autenticados — header, tema e area principal. */
export default function PortalShell({
  portal,
  portalLabel,
  loginPath,
  userName,
  branding,
  niche,
  labels,
  children,
}: Props) {
  return (
    <NicheProvider niche={niche} labels={labels}>
      <TenantTheme branding={branding} portal={portal} className="flex flex-1 flex-col">
        <a href="#portal-main" className="ds-skip-link">
          Ir para o conteúdo
        </a>
        <PortalHeader
          portalLabel={portalLabel}
          displayName={branding.displayName}
          logoUrl={branding.logoUrl}
          userName={userName}
          loginPath={loginPath}
          platformLabel={branding.platformLabel}
        />
        <main id="portal-main" className="ds-page-shell min-w-0">{children}</main>
      </TenantTheme>
    </NicheProvider>
  );
}
