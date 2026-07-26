"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";
import Card from "@/components/ui/Card";
import InfoTooltip from "@/components/ui/InfoTooltip";

type Tone = "default" | "warning" | "success" | "brand" | "accent" | "danger";

const valueToneClass: Record<Tone, string> = {
  default: "text-[var(--text-primary)]",
  warning: "text-[var(--status-warning-text)]",
  success: "text-[var(--status-success-text)]",
  brand: "text-[var(--status-brand-text)]",
  accent: "text-[var(--portal-accent)]",
  danger: "text-[var(--status-danger-text)]",
};

type Props = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  info?: string;
  tone?: Tone;
  className?: string;
};

export default function StatCard({ label, value, hint, info, tone = "default", className }: Props) {
  const hintId = useId();
  const describedBy = hint ? hintId : undefined;

  return (
    <Card
      padding="sm"
      className={cn(
        "flex flex-col max-sm:!p-3",
        className,
      )}
    >
      <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] sm:text-sm">
        <span className="min-w-0 break-words">{label}</span>
        {info ? <InfoTooltip content={info} label={`Ajuda: ${label}`} /> : null}
      </p>
      <p
        className={cn(
          "mt-0.5 text-xl font-bold tracking-tight sm:mt-1 sm:text-2xl",
          valueToneClass[tone],
        )}
        aria-describedby={describedBy}
      >
        {value}
      </p>
      {hint ? (
        <p id={hintId} className="mt-0.5 text-xs text-[var(--text-muted)] sm:mt-1">
          {hint}
        </p>
      ) : null}
    </Card>
  );
}
