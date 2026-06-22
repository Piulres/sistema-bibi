"use client";

import PortalShell from "@/components/layout/PortalShell";
import SectionNav from "@/components/ui/SectionNav";
import { PORTALS } from "@/lib/roles";
import { PORTAL_THEMES } from "@/lib/theme/portals";
import { PJ_SECTION_NAV } from "@/lib/navigation";
import type { SessionUser } from "@/lib/session";

type Props = {
  user: SessionUser | null;
  children: React.ReactNode;
};

export default function PjPortalShell({ user, children }: Props) {
  if (!user || user.role !== "PJ") {
    return children;
  }

  const portal = PORTALS.pj;
  const theme = PORTAL_THEMES.pj;

  return (
    <PortalShell
      portal="pj"
      portalLabel={portal.label}
      loginPath={portal.loginPath}
      userName={user.name}
      branding={user.branding}
    >
      <SectionNav
        sections={PJ_SECTION_NAV}
        activeClass={theme.navActiveClass}
        idleClass={theme.navIdleClass}
        className="mt-6"
      />
      <div className="portal-page-content mt-8">{children}</div>
    </PortalShell>
  );
}
