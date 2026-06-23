import { Suspense } from "react";
import LandingNicheSwitcher from "@/components/landing/LandingNicheSwitcher";

export default function LandingNicheSwitcherBar() {
  return (
    <div className="border-b border-[var(--border-default)]/60 bg-[var(--surface-muted)]/50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          ServiceOS v2.0 · demonstração multi-nicho
        </p>
        <Suspense fallback={null}>
          <LandingNicheSwitcher />
        </Suspense>
      </div>
    </div>
  );
}
