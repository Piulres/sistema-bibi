"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import NavTabs from "@/components/ui/NavTabs";
import MobileNavDrawer from "@/components/layout/MobileNavDrawer";
import { PORTAL_MOBILE_ACTIVE_CLASS, PORTAL_NAV_ACTIVE_CLASS, PORTAL_NAV_IDLE_CLASS } from "@/lib/theme/portals";
import { buildBeneficiarioNavTabs } from "@/lib/navigation/niche-nav";
import { resolveBeneficiarioActive } from "@/lib/navigation";
import { useLabels } from "@/hooks/useLabels";

export default function BeneficiarioNav() {
  const pathname = usePathname();
  const active = resolveBeneficiarioActive(pathname);
  const { labels } = useLabels();
  const tabs = useMemo(() => buildBeneficiarioNavTabs(labels), [labels]);

  return (
    <div className="mt-6" data-tour-id="portal-nav">
      <MobileNavDrawer
        tabs={tabs}
        active={active}
        activeClass={PORTAL_MOBILE_ACTIVE_CLASS}
        idleClass="text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
        title="Módulos do portal"
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
