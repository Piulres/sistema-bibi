"use client";

import { usePathname } from "next/navigation";
import NavTabs from "@/components/ui/NavTabs";
import MobileNavDrawer from "@/components/layout/MobileNavDrawer";
import { PORTAL_THEMES } from "@/lib/theme/portals";
import { BENEFICIARIO_NAV_TABS, resolveBeneficiarioActive } from "@/lib/navigation";

export default function BeneficiarioNav() {
  const pathname = usePathname();
  const theme = PORTAL_THEMES.beneficiario;
  const active = resolveBeneficiarioActive(pathname);

  return (
    <div className="mt-6">
      <MobileNavDrawer
        tabs={BENEFICIARIO_NAV_TABS}
        active={active}
        activeClass="bg-[var(--surface-muted)] text-[var(--portal-accent)]"
        idleClass="text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
        title="Módulos do beneficiário"
      />
      <NavTabs
        tabs={BENEFICIARIO_NAV_TABS}
        active={active}
        activeClass={theme.navActiveClass}
        idleClass={theme.navIdleClass}
        className="hidden lg:flex"
      />
    </div>
  );
}
