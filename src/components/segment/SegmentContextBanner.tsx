import { PLATFORM } from "@/lib/platform";
import type { LoginSegmentContext } from "@/lib/segment/login-context";

type Props = {
  context: Pick<
    LoginSegmentContext,
    "niche" | "nicheName" | "tenantName" | "tenantSlug"
  >;
};

/** Banner do segmento ativo na tela de login. */
export default function SegmentContextBanner({ context }: Props) {
  if (!context.tenantSlug && context.niche === "MEDICAL") {
    return (
      <div className="mt-4 rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text-secondary)]">
        Segmento: <strong>{context.nicheName}</strong> · {PLATFORM.versionLabel}
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-[var(--radius-button)] border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/5 px-3 py-2 text-xs text-[var(--text-secondary)]">
      Operação: <strong>{context.tenantName ?? context.tenantSlug}</strong> · Segmento{" "}
      <strong>{context.nicheName}</strong>
      {context.tenantSlug && (
        <>
          {" "}
          · <span className="font-mono text-[var(--text-muted)]">?tenant={context.tenantSlug}</span>
        </>
      )}
    </div>
  );
}
