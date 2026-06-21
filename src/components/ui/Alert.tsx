import { cn } from "@/lib/utils/cn";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  tone?: "info" | "success" | "warning" | "danger";
};

const toneClass = {
  info: "border-[var(--status-info-text)]/20 bg-[var(--status-info-bg)] text-[var(--status-info-text)]",
  success:
    "border-[var(--status-success-text)]/20 bg-[var(--status-success-bg)] text-[var(--status-success-text)]",
  warning:
    "border-[var(--status-warning-text)]/20 bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]",
  danger:
    "border-[var(--status-danger-text)]/20 bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]",
};

export default function Alert({
  tone = "info",
  className,
  children,
  ...props
}: Props) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-[var(--radius-button)] border px-3 py-2 text-sm",
        toneClass[tone],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
