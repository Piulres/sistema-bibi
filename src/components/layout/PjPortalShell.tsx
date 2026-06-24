"use client";

import PortalShell from "@/components/layout/PortalShell";
import AssistantShell from "@/components/assistant/AssistantShell";
import SectionNav from "@/components/ui/SectionNav";
import { PORTALS } from "@/lib/roles";
import { PORTAL_THEMES } from "@/lib/theme/portals";
import { buildPjSectionNav } from "@/lib/navigation/niche-nav";
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
  const sections = buildPjSectionNav(user.labels);

  return (
    <PortalShell
      portal="pj"
      portalLabel={`Portal ${user.labels.company}`}
      loginPath={portal.loginPath}
      userName={user.name}
      branding={user.branding}
      niche={user.niche}
      labels={user.labels}
    >
      <SectionNav
        sections={sections}
        activeClass={theme.navActiveClass}
        idleClass={theme.navIdleClass}
        className="mt-6"
        drawerTitle="Seções da empresa"
      />
      <AssistantShell portal="pj">
        <div className="portal-page-content mt-8 min-w-0">{children}</div>
      </AssistantShell>
    </PortalShell>
  );
}
