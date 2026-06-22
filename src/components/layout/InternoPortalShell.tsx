"use client";

import { usePathname } from "next/navigation";
import PortalShell from "@/components/layout/PortalShell";
import InternoNav from "@/components/InternoNav";
import { PORTALS } from "@/lib/roles";
import { INTERNO_PUBLIC_PATHS } from "@/lib/navigation";
import type { SessionUser } from "@/lib/session";

type Props = {
  user: SessionUser | null;
  children: React.ReactNode;
};

/** Mantém shell e navegação do interno entre transições SPA. */
export default function InternoPortalShell({ user, children }: Props) {
  const pathname = usePathname();

  if (INTERNO_PUBLIC_PATHS.includes(pathname as (typeof INTERNO_PUBLIC_PATHS)[number])) {
    return children;
  }

  if (!user || user.role !== "INTERNO") {
    return children;
  }

  const portal = PORTALS.interno;

  return (
    <PortalShell
      portal="interno"
      portalLabel={portal.label}
      loginPath={portal.loginPath}
      userName={user.name}
      branding={user.branding}
    >
      <InternoNav permissions={user.internoPermissions} />
      <div className="portal-page-content mt-8">{children}</div>
    </PortalShell>
  );
}
