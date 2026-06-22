"use client";

import { usePathname } from "next/navigation";
import NavTabs from "@/components/ui/NavTabs";
import MobileNavDrawer from "@/components/layout/MobileNavDrawer";
import { PORTAL_THEMES } from "@/lib/theme/portals";
import { PRESTADOR_NAV_TABS, resolvePrestadorActive } from "@/lib/navigation";

export default function PrestadorNav() {
  const pathname = usePathname();
  const theme = PORTAL_THEMES.prestador;
  const active = resolvePrestadorActive(pathname);

  return (
    <div className="mt-6">
      <MobileNavDrawer
        tabs={PRESTADOR_NAV_TABS}
        active={active}
        activeClass="bg-[var(--surface-muted)] text-[var(--portal-accent)]"
        idleClass="text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
        title="Módulos do prestador"
      />
      <NavTabs
        tabs={PRESTADOR_NAV_TABS}
        active={active}
        activeClass={theme.navActiveClass}
        idleClass={theme.navIdleClass}
        className="hidden lg:flex"
      />
    </div>
  );
}
