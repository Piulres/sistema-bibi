"use client";

import { usePathname } from "next/navigation";
import NavTabs from "@/components/ui/NavTabs";
import { PORTAL_THEMES } from "@/lib/theme/portals";
import { PRESTADOR_NAV_TABS, resolvePrestadorActive } from "@/lib/navigation";

export default function PrestadorNav() {
  const pathname = usePathname();
  const theme = PORTAL_THEMES.prestador;
  const active = resolvePrestadorActive(pathname);

  return (
    <NavTabs
      tabs={PRESTADOR_NAV_TABS}
      active={active}
      activeClass={theme.navActiveClass}
      idleClass={theme.navIdleClass}
      className="mt-6"
    />
  );
}
