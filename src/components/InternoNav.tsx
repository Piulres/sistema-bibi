"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import NavTabs from "@/components/ui/NavTabs";
import MobileNavDrawer from "@/components/layout/MobileNavDrawer";
import { PORTAL_THEMES } from "@/lib/theme/portals";
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
  const theme = PORTAL_THEMES.interno;
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
        activeClass="bg-[var(--surface-muted)] text-[var(--portal-accent)]"
        idleClass="text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
        title="Módulos internos"
      />
      <NavTabs
        tabs={tabs}
        active={resolvedActive}
        activeClass={theme.navActiveClass}
        idleClass={theme.navIdleClass}
        className="hidden lg:flex"
      />
    </div>
  );
}
