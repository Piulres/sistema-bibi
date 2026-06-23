import { Suspense } from "react";
import LandingNicheSwitcher from "@/components/landing/LandingNicheSwitcher";

export default function LandingNicheSwitcherBar() {
  return (
    <div className="border-b border-[var(--border-default)]/60 bg-[var(--surface-muted)]/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          ServiceOS v2.0 · demonstração multi-nicho
        </p>
        <div className="-mx-1 overflow-x-auto px-1 pb-0.5 sm:mx-0 sm:overflow-visible sm:pb-0">
          <Suspense fallback={null}>
            <LandingNicheSwitcher />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
