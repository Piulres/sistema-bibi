import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { appointmentStatusClass } from "@/lib/theme/status-styles";

type Props = {
  time?: string;
  title: string;
  subtitle?: string;
  status: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  href?: string;
  particular?: boolean;
  className?: string;
};

function statusBorderClass(status: string): string {
  const bg = appointmentStatusClass[status];
  if (!bg) return "border-l-[var(--border-muted)]";
  if (status === "CONFIRMADO") return "border-l-[var(--status-info-text)]";
  if (status === "REALIZADO") return "border-l-[var(--status-success-text)]";
  if (status === "FALTOU") return "border-l-[var(--status-warning-text)]";
  if (status === "CANCELADO") return "border-l-[var(--status-danger-text)]";
  return "border-l-[var(--status-neutral-text)]";
}

function CardInner({
  time,
  title,
  subtitle,
  status,
  meta,
  actions,
  particular,
}: Omit<Props, "href" | "className">) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        {time ? (
          <div className="shrink-0 text-center">
            <p className="text-lg font-bold tabular-nums text-[var(--text-primary)]">{time}</p>
          </div>
        ) : null}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-[var(--text-primary)]">{title}</p>
            {particular ? (
              <span className="rounded-full bg-[var(--status-brand-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--status-brand-text)]">
                Particular
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">{subtitle}</p>
          ) : null}
          {meta ? <div className="mt-1">{meta}</div> : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge value={status} map="appointment" />
        {actions}
      </div>
    </div>
  );
}

export default function AppointmentCard({
  time,
  title,
  subtitle,
  status,
  meta,
  actions,
  href,
  particular,
  className,
}: Props) {
  const border = cn("border-l-4", statusBorderClass(status));

  if (href) {
    return (
      <Link href={href} className="block">
        <Card
          padding="sm"
          className={cn(
            border,
            "transition hover:border-[var(--portal-accent)] hover:shadow-md",
            className,
          )}
        >
          <CardInner
            time={time}
            title={title}
            subtitle={subtitle}
            status={status}
            meta={meta}
            actions={actions}
            particular={particular}
          />
        </Card>
      </Link>
    );
  }

  return (
    <Card padding="sm" className={cn(border, className)}>
      <CardInner
        time={time}
        title={title}
        subtitle={subtitle}
        status={status}
        meta={meta}
        actions={actions}
        particular={particular}
      />
    </Card>
  );
}
