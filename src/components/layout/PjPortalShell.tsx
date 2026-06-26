"use client";

import PortalShell from "@/components/layout/PortalShell";
import AssistantShell from "@/components/assistant/AssistantShell";
import SectionNav from "@/components/ui/SectionNav";
import { PORTALS } from "@/lib/roles";
import { PORTAL_NAV_ACTIVE_CLASS, PORTAL_NAV_IDLE_CLASS } from "@/lib/theme/portals";
import { buildPjSectionNav } from "@/lib/navigation/niche-nav";
import type { SessionUser } from "@/lib/session";

type Props = {
  user: SessionUser | null;
  assistantEnabled?: boolean;
  children: React.ReactNode;
};

export default function PjPortalShell({ user, assistantEnabled = true, children }: Props) {
  if (!user || user.role !== "PJ") {
    return children;
  }

  const portal = PORTALS.pj;
  const sections = buildPjSectionNav(user.labels, user.niche);

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
        activeClass={PORTAL_NAV_ACTIVE_CLASS}
        idleClass={PORTAL_NAV_IDLE_CLASS}
        className="mt-6"
        drawerTitle="Seções da empresa"
      />
      <AssistantShell portal="pj" enabled={assistantEnabled}>
        <div className="portal-page-content mt-8 min-w-0">{children}</div>
      </AssistantShell>
    </PortalShell>
  );
}
