"use client";

import { useRouter } from "next/navigation";
import { PLATFORM } from "@/lib/platform";
import Button from "@/components/ui/Button";
import ServiceOsBadges from "@/components/niche/ServiceOsBadges";
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
    <header className="border-b border-[var(--border-default)] bg-[var(--surface-card)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="h-9 w-9 shrink-0 rounded-lg object-contain"
            />
          ) : (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-[var(--text-inverse)] ds-gradient-brand"
              aria-hidden
            >
              {displayName.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-[var(--brand-accent)]">
              {portalLabel}
            </p>
            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
              {displayName}
            </p>
            <ServiceOsBadges niche={niche} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span
            className="max-w-[5.5rem] truncate text-xs text-[var(--text-secondary)] sm:max-w-none sm:text-sm"
            title={userName}
          >
            {userName}
          </span>
          <Button variant="secondary" size="sm" onClick={logout}>
            Sair
          </Button>
        </div>
      </div>
      <p className="border-t border-[var(--border-default)] bg-[var(--surface-muted)] px-6 py-1 text-center text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
        {platformLabel} · white label
      </p>
    </header>
  );
}
