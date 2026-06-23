import { cn } from "@/lib/utils/cn";

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "info" | "success" | "warning" | "danger" | "brand" | "accent";
};

const toneClass = {
  neutral: "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-text)]",
  info: "bg-[var(--status-info-bg)] text-[var(--status-info-text)]",
  success: "bg-[var(--status-success-bg)] text-[var(--status-success-text)]",
  warning: "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]",
  danger: "bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]",
  brand: "bg-[var(--status-brand-bg)] text-[var(--status-brand-text)]",
  accent: "bg-[var(--brand-accent)] text-[var(--text-inverse)]",
};

export default function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClass[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
