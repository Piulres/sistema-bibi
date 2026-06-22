import { cn } from "@/lib/utils/cn";
import Card from "@/components/ui/Card";

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
  tone?: Tone;
  className?: string;
};

export default function StatCard({ label, value, hint, tone = "default", className }: Props) {
  return (
    <Card padding="sm" className={cn("flex flex-col", className)}>
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold tracking-tight", valueToneClass[tone])}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p> : null}
    </Card>
  );
}
