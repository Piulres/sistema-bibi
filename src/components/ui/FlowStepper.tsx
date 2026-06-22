import { cn } from "@/lib/utils/cn";

export type FlowStep = {
  id: string;
  label: string;
};

type Props = {
  steps: FlowStep[];
  currentStepId: string;
  className?: string;
};

export default function FlowStepper({ steps, currentStepId, className }: Props) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === currentStepId),
  );

  return (
    <ol
      className={cn(
        "flex flex-wrap items-center gap-1 text-xs sm:gap-0",
        className,
      )}
      aria-label="Progresso do atendimento"
    >
      {steps.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={step.id} className="flex items-center">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium transition",
                done && "bg-[var(--status-success-bg)] text-[var(--status-success-text)]",
                active && "bg-[var(--portal-accent)]/15 text-[var(--portal-accent)] ring-1 ring-[var(--portal-accent)]/30",
                !done && !active && "bg-[var(--surface-muted)] text-[var(--text-muted)]",
              )}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  done && "bg-[var(--status-success-text)] text-white",
                  active && "bg-[var(--portal-accent)] text-white",
                  !done && !active && "bg-[var(--border-muted)] text-[var(--text-muted)]",
                )}
              >
                {done ? "✓" : index + 1}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </span>
            {index < steps.length - 1 ? (
              <span
                className={cn(
                  "mx-1 hidden h-px w-4 sm:block md:w-8",
                  index < currentIndex
                    ? "bg-[var(--status-success-text)]/50"
                    : "bg-[var(--border-default)]",
                )}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
