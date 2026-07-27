"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
};

/** Select com label associado — evita placeholder-as-label em formulários. */
export default function Select({
  label,
  hint,
  className,
  id,
  children,
  ...props
}: Props) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const hintId = hint ? `${selectId}-hint` : undefined;

  return (
    <div>
      <label
        className="block text-sm font-medium text-[var(--text-secondary)]"
        htmlFor={selectId}
      >
        {label}
      </label>
      <select
        id={selectId}
        aria-describedby={hintId}
        className={cn(
          "mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-[var(--text-primary)] transition focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {hint ? (
        <p id={hintId} className="mt-1 text-xs text-[var(--text-muted)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
