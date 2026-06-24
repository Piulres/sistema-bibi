"use client";

import Image from "next/image";
import type { BrandingTokens } from "@/lib/theme/tokens";

type Props = {
  branding: BrandingTokens;
};

/** Logo do header — sempre rola ao topo da página atual (sem redirecionar para `/`). */
export default function LandingLogoLink({ branding }: Props) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="flex min-w-0 items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2"
      aria-label={`${branding.displayName} — voltar ao topo`}
    >
      {branding.logoUrl ? (
        <Image
          src={branding.logoUrl}
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 rounded-xl object-contain"
          priority
        />
      ) : (
        <span
          className="ds-logo-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-[var(--text-inverse)] shadow-sm"
          aria-hidden
        >
          {branding.displayName.charAt(0)}
        </span>
      )}
      <span className="truncate text-base font-semibold tracking-tight text-[var(--text-primary)]">
        {branding.displayName}
      </span>
    </button>
  );
}
