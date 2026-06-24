"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import NavTabs from "@/components/ui/NavTabs";
import MobileNavDrawer from "@/components/layout/MobileNavDrawer";
import { PORTAL_MOBILE_ACTIVE_CLASS, PORTAL_NAV_ACTIVE_CLASS, PORTAL_NAV_IDLE_CLASS } from "@/lib/theme/portals";
import { buildPrestadorNavTabs } from "@/lib/navigation/niche-nav";
import { resolvePrestadorActive } from "@/lib/navigation";
import { useLabels } from "@/hooks/useLabels";

export default function PrestadorNav() {
  const pathname = usePathname();
  const active = resolvePrestadorActive(pathname);
  const { labels } = useLabels();
  const tabs = useMemo(() => buildPrestadorNavTabs(labels), [labels]);

  return (
    <div className="mt-6">
      <MobileNavDrawer
        tabs={tabs}
        active={active}
        activeClass={PORTAL_MOBILE_ACTIVE_CLASS}
        idleClass="text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
        title="Módulos do prestador"
      />
      <NavTabs
        tabs={tabs}
        active={active}
        activeClass={PORTAL_NAV_ACTIVE_CLASS}
        idleClass={PORTAL_NAV_IDLE_CLASS}
        className="hidden lg:flex"
      />
    </div>
  );
}
