import { cn } from "@/lib/utils/cn";

const variants = {
  primary:
    "bg-[var(--brand-primary)] text-[var(--text-inverse)] hover:bg-[var(--brand-primary-hover)] focus-visible:ring-[var(--ring-focus)]",
  secondary:
    "border border-[var(--border-muted)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] focus-visible:ring-[var(--ring-focus)]",
  portal:
    "bg-[var(--portal-accent)] text-[var(--text-inverse)] hover:opacity-90 focus-visible:ring-[var(--ring-focus)]",
  ghost:
    "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] focus-visible:ring-[var(--ring-focus)]",
  danger:
    "bg-[var(--status-danger-text)] text-[var(--text-inverse)] hover:opacity-90 focus-visible:ring-red-200",
} as const;

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm font-semibold",
  lg: "px-5 py-3 text-base font-semibold",
} as const;

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-button)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
