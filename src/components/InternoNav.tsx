"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import NavTabs from "@/components/ui/NavTabs";
import MobileNavDrawer from "@/components/layout/MobileNavDrawer";
import { PORTAL_MOBILE_ACTIVE_CLASS, PORTAL_NAV_ACTIVE_CLASS, PORTAL_NAV_IDLE_CLASS } from "@/lib/theme/portals";
import { resolveInternoActive } from "@/lib/navigation";
import { buildInternoNavTabs } from "@/lib/navigation/niche-nav";
import { useLabels } from "@/hooks/useLabels";
import type { InternoModule } from "@/lib/interno-permissions";

export default function InternoNav({
  active,
  permissions,
}: {
  active?: InternoModule;
  permissions?: InternoModule[];
}) {
  const pathname = usePathname();
  const resolvedActive = active ?? resolveInternoActive(pathname);
  const { labels, niche } = useLabels();
  const allTabs = useMemo(() => buildInternoNavTabs(labels, niche), [labels, niche]);

  const tabs =
    permissions && permissions.length > 0
      ? allTabs.filter((tab) => permissions.includes(tab.key as InternoModule))
      : allTabs;

  return (
    <div className="mt-6">
      <MobileNavDrawer
        tabs={tabs}
        active={resolvedActive}
        activeClass={PORTAL_MOBILE_ACTIVE_CLASS}
        idleClass="text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
        title="Módulos internos"
      />
      <NavTabs
        tabs={tabs}
        active={resolvedActive}
        activeClass={PORTAL_NAV_ACTIVE_CLASS}
        idleClass={PORTAL_NAV_IDLE_CLASS}
        className="hidden lg:flex"
      />
    </div>
  );
}
