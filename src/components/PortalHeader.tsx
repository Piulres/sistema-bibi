"use client";

import { useRouter } from "next/navigation";
import { PLATFORM } from "@/lib/platform";
import Button from "@/components/ui/Button";
import ServiceOsBadges from "@/components/niche/ServiceOsBadges";
import HomeBrandLink from "@/components/brand/HomeBrandLink";
import OnboardingTrigger from "@/components/onboarding/OnboardingTrigger";
import { useLabels } from "@/hooks/useLabels";

type Props = {
  portalLabel: string;
  displayName: string;
  logoUrl?: string | null;
  userName: string;
  loginPath: string;
  platformLabel?: string;
};

export default function PortalHeader({
  portalLabel,
  displayName,
  logoUrl,
  userName,
  loginPath,
  platformLabel = PLATFORM.poweredBy,
}: Props) {
  const router = useRouter();
  const { niche } = useLabels();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(loginPath);
    router.refresh();
  }

  return (
    <header className="border-b border-[var(--border-default)] bg-[var(--surface-card)]" data-testid="portal-header" data-tour-id="portal-header">
      <div className="mx-auto flex max-w-5xl min-w-0 items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
        <HomeBrandLink
          displayName={displayName}
          logoUrl={logoUrl}
          logoSize="sm"
          showTitle={false}
          className="min-w-0 flex-1"
        >
          <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-accent)] sm:text-xs">
            {portalLabel}
          </p>
          <p className="truncate text-sm font-medium text-[var(--text-primary)]">
            {displayName}
          </p>
          <ServiceOsBadges niche={niche} />
        </HomeBrandLink>
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <OnboardingTrigger />
          <span
            className="hidden max-w-[8rem] truncate text-sm text-[var(--text-secondary)] sm:inline"
            title={userName}
          >
            {userName}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={logout}
            aria-label={`Sair (${userName})`}
            title={userName}
          >
            Sair
          </Button>
        </div>
      </div>
      <p className="border-t border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-1 text-center text-[10px] uppercase tracking-widest text-[var(--text-muted)] sm:px-6">
        <span className="sm:hidden">ServiceOS · white label</span>
        <span className="hidden sm:inline">{platformLabel} · white label</span>
      </p>
    </header>
  );
}
