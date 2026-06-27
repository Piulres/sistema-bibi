"use client";

import PortalShell from "@/components/layout/PortalShell";
import AssistantShell from "@/components/assistant/AssistantShell";
import PrestadorNav from "@/components/PrestadorNav";
import FeedbackProvider from "@/components/ui/FeedbackProvider";
import { OnboardingProvider, OnboardingTour } from "@/components/onboarding";
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
    <OnboardingProvider portal="prestador" labels={user.labels} niche={user.niche}>
      <FeedbackProvider>
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
          <div className="portal-page-content mt-8 min-w-0" data-tour-id="portal-content">
            {children}
          </div>
        </AssistantShell>
      </PortalShell>
      <OnboardingTour />
      </FeedbackProvider>
    </OnboardingProvider>
  );
}
