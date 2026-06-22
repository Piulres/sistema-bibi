"use client";

import PortalShell from "@/components/layout/PortalShell";
import SectionNav from "@/components/ui/SectionNav";
import { PORTALS } from "@/lib/roles";
import { PORTAL_THEMES } from "@/lib/theme/portals";
import { BENEFICIARIO_SECTION_NAV } from "@/lib/navigation";
import type { SessionUser } from "@/lib/session";

type Props = {
  user: SessionUser | null;
  children: React.ReactNode;
};

export default function BeneficiarioPortalShell({ user, children }: Props) {
  if (!user || user.role !== "BENEFICIARIO") {
    return children;
  }

  const portal = PORTALS.beneficiario;
  const theme = PORTAL_THEMES.beneficiario;

  return (
    <PortalShell
      portal="beneficiario"
      portalLabel={portal.label}
      loginPath={portal.loginPath}
      userName={user.name}
      branding={user.branding}
    >
      <SectionNav
        sections={BENEFICIARIO_SECTION_NAV}
        activeClass={theme.navActiveClass}
        idleClass={theme.navIdleClass}
        className="mt-6"
        drawerTitle="Seções do beneficiário"
      />
      <div className="portal-page-content mt-8 min-w-0">{children}</div>
    </PortalShell>
  );
}
