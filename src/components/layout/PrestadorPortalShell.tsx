"use client";

import PortalShell from "@/components/layout/PortalShell";
import AssistantShell from "@/components/assistant/AssistantShell";
import PrestadorNav from "@/components/PrestadorNav";
import { PORTALS } from "@/lib/roles";
import type { SessionUser } from "@/lib/session";

type Props = {
  user: SessionUser | null;
  assistantEnabled?: boolean;
  children: React.ReactNode;
};

/** Mantém shell do prestador entre agenda e atendimento. */
export default function PrestadorPortalShell({ user, assistantEnabled = true, children }: Props) {
  if (!user || user.role !== "PRESTADOR") {
    return children;
  }

  const portal = PORTALS.prestador;

  return (
    <PortalShell
      portal="prestador"
      portalLabel={user.labels.portalProvider}
      loginPath={portal.loginPath}
      userName={user.name}
      branding={user.branding}
      niche={user.niche}
      labels={user.labels}
    >
      <PrestadorNav />
      <AssistantShell portal="prestador" enabled={assistantEnabled}>
        <div className="portal-page-content mt-8 min-w-0">{children}</div>
      </AssistantShell>
    </PortalShell>
  );
}
