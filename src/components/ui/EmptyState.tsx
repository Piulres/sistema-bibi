import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

type Props = {
  message: string;
  title?: string;
  hint?: string;
  className?: string;
};

export default function EmptyState({ message, title, hint, className }: Props) {
  return (
    <Card
      padding="sm"
      className={cn(
        "mt-4 border-dashed bg-[var(--surface-muted)]/50 text-center",
        className,
      )}
    >
      <div className="mx-auto max-w-md py-4">
        <p className="text-2xl" aria-hidden>
          ○
        </p>
        {title ? (
          <p className="mt-2 font-medium text-[var(--text-secondary)]">{title}</p>
        ) : null}
        <p className={cn("text-sm text-[var(--text-muted)]", title ? "mt-1" : "mt-2")}>
          {message}
        </p>
        {hint ? <p className="mt-2 text-xs text-[var(--text-muted)]">{hint}</p> : null}
      </div>
    </Card>
  );
}
