import { cn } from "@/lib/utils/cn";
import Card from "@/components/ui/Card";

type Variant = "walk-in" | "info" | "success";

const variantClass: Record<Variant, string> = {
  "walk-in":
    "border-l-4 border-l-[var(--portal-accent)] bg-[var(--status-info-bg)]/40",
  info: "border-l-4 border-l-[var(--status-info-text)] bg-[var(--status-info-bg)]/30",
  success:
    "border-l-4 border-l-[var(--status-success-text)] bg-[var(--status-success-bg)]/30",
};

type Props = React.HTMLAttributes<HTMLDivElement> & {
  variant?: Variant;
  title: string;
  description?: string;
  badge?: string;
};

export default function CalloutCard({
  variant = "info",
  title,
  description,
  badge,
  className,
  children,
  ...props
}: Props) {
  return (
    <Card
      className={cn(variantClass[variant], className)}
      padding="md"
      {...props}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
            {badge ? (
              <span className="rounded-full bg-[var(--portal-accent)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--portal-accent)]">
                {badge}
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </Card>
  );
}
