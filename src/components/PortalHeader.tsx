"use client";

import { useRouter } from "next/navigation";

type Props = {
  portalLabel: string;
  tenantName: string;
  userName: string;
  loginPath: string;
};

export default function PortalHeader({
  portalLabel,
  tenantName,
  userName,
  loginPath,
}: Props) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(loginPath);
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            {portalLabel}
          </p>
          <p className="text-sm font-medium text-slate-900">{tenantName}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-600 sm:inline">{userName}</span>
          <button
            onClick={logout}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
