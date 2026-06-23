"use client";

import PortalShell from "@/components/layout/PortalShell";
import PrestadorNav from "@/components/PrestadorNav";
import { PORTALS } from "@/lib/roles";
import type { SessionUser } from "@/lib/session";

type Props = {
  user: SessionUser | null;
  children: React.ReactNode;
};

/** Mantém shell do prestador entre agenda e atendimento. */
export default function PrestadorPortalShell({ user, children }: Props) {
  if (!user || user.role !== "PRESTADOR") {
    return children;
  }

  const portal = PORTALS.prestador;

  return (
    <PortalShell
      portal="prestador"
      portalLabel={portal.label}
      loginPath={portal.loginPath}
      userName={user.name}
      branding={user.branding}
      niche={user.niche}
      labels={user.labels}
    >
      <PrestadorNav />
      <div className="portal-page-content mt-8 min-w-0">{children}</div>
    </PortalShell>
  );
}
