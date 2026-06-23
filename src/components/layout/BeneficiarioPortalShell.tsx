"use client";

import PortalShell from "@/components/layout/PortalShell";
import BeneficiarioNav from "@/components/BeneficiarioNav";
import { PORTALS } from "@/lib/roles";
import type { SessionUser } from "@/lib/session";

type Props = {
  user: SessionUser | null;
  children: React.ReactNode;
};

export default function BeneficiarioPortalShell({ user, children }: Props) {
  if (!user || user.role !== "BENEFICIARIO") {
    return children;
  }

  const portal = PORTALS.beneficiario;

  return (
    <PortalShell
      portal="beneficiario"
      portalLabel={portal.label}
      loginPath={portal.loginPath}
      userName={user.name}
      branding={user.branding}
      niche={user.niche}
      labels={user.labels}
    >
      <BeneficiarioNav />
      <div className="portal-page-content mt-8 min-w-0">{children}</div>
    </PortalShell>
  );
}
