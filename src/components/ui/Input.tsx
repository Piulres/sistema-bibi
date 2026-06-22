"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";
import InfoTooltip from "@/components/ui/InfoTooltip";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  info?: string;
};

export default function Input({ label, hint, info, className, id, ...props }: Props) {
  const autoId = useId();
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : autoId);
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div>
      {label && (
        <label
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)]"
          htmlFor={inputId}
        >
          <span>{label}</span>
          {info ? <InfoTooltip content={info} label={`Ajuda: ${label}`} /> : null}
        </label>
      )}
      <input
        id={inputId}
        aria-describedby={hintId}
        className={cn(
          "mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-[var(--text-primary)] transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]",
          className,
        )}
        {...props}
      />
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-[var(--text-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}
