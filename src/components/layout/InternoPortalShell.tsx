"use client";

import { usePathname } from "next/navigation";
import PortalShell from "@/components/layout/PortalShell";
import AssistantShell from "@/components/assistant/AssistantShell";
import InternoNav from "@/components/InternoNav";
import { OnboardingProvider, OnboardingTour } from "@/components/onboarding";
import FeedbackProvider from "@/components/ui/FeedbackProvider";
import { PORTALS } from "@/lib/roles";
import { INTERNO_PUBLIC_PATHS } from "@/lib/navigation";
import type { SessionUser } from "@/lib/session";

type Props = {
  user: SessionUser | null;
  assistantEnabled?: boolean;
  children: React.ReactNode;
};

/** Mantém shell e navegação do interno entre transições SPA. */
export default function InternoPortalShell({ user, assistantEnabled = true, children }: Props) {
  const pathname = usePathname();

  if (INTERNO_PUBLIC_PATHS.includes(pathname as (typeof INTERNO_PUBLIC_PATHS)[number])) {
    return children;
  }

  if (!user || user.role !== "INTERNO") {
    return children;
  }

  const portal = PORTALS.interno;

  return (
    <OnboardingProvider portal="interno" labels={user.labels} permissions={user.internoPermissions}>
      <FeedbackProvider>
        <PortalShell
          portal="interno"
          portalLabel={`Operação · ${user.labels.beneficiaries}`}
          loginPath={portal.loginPath}
          userName={user.name}
          branding={user.branding}
          niche={user.niche}
          labels={user.labels}
        >
          <InternoNav permissions={user.internoPermissions} />
          <AssistantShell portal="interno" enabled={assistantEnabled}>
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
