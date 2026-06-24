"use client";

import PortalShell from "@/components/layout/PortalShell";
import AssistantShell from "@/components/assistant/AssistantShell";
import BeneficiarioNav from "@/components/BeneficiarioNav";
import { PORTALS } from "@/lib/roles";
import type { SessionUser } from "@/lib/session";

type Props = {
  user: SessionUser | null;
  assistantEnabled?: boolean;
  children: React.ReactNode;
};

export default function BeneficiarioPortalShell({ user, assistantEnabled = true, children }: Props) {
  if (!user || user.role !== "BENEFICIARIO") {
    return children;
  }

  const portal = PORTALS.beneficiario;

  return (
    <PortalShell
      portal="beneficiario"
      portalLabel={user.labels.portalBeneficiary}
      loginPath={portal.loginPath}
      userName={user.name}
      branding={user.branding}
      niche={user.niche}
      labels={user.labels}
    >
      <BeneficiarioNav />
      <AssistantShell portal="beneficiario" enabled={assistantEnabled}>
        <div className="portal-page-content mt-8 min-w-0">{children}</div>
      </AssistantShell>
    </PortalShell>
  );
}
