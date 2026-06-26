"use client";

type TimelineTask = {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  progressPercent: number;
  dependsOnName?: string | null;
};

type Props = {
  tasks: TimelineTask[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Timeline horizontal simples (estilo Gantt) para tarefas com datas. */
export default function ScheduleTimeline({ tasks }: Props) {
  const dated = tasks
    .map((t) => ({
      ...t,
      start: parseDate(t.startDate),
      end: parseDate(t.endDate),
    }))
    .filter((t) => t.start && t.end) as Array<
    TimelineTask & { start: Date; end: Date }
  >;

  if (dated.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        Defina datas de início e fim nas tarefas para visualizar o cronograma.
      </p>
    );
  }

  const rangeStart = Math.min(...dated.map((t) => t.start.getTime()));
  const rangeEnd = Math.max(...dated.map((t) => t.end.getTime()));
  const span = Math.max(rangeEnd - rangeStart, DAY_MS);

  const startLabel = new Date(rangeStart).toLocaleDateString("pt-BR");
  const endLabel = new Date(rangeEnd).toLocaleDateString("pt-BR");

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
      <div className="mb-3 flex justify-between text-xs text-[var(--text-muted)]">
        <span>{startLabel}</span>
        <span>Cronograma</span>
        <span>{endLabel}</span>
      </div>
      <div className="space-y-3">
        {dated.map((task) => {
          const left = ((task.start.getTime() - rangeStart) / span) * 100;
          const width = Math.max(((task.end.getTime() - task.start.getTime()) / span) * 100, 2);
          return (
            <div key={task.id} className="grid grid-cols-[minmax(6rem,8rem)_1fr] items-center gap-3">
              <p className="truncate text-xs font-medium text-[var(--text-secondary)]" title={task.name}>
                {task.name}
              </p>
              <div className="relative h-7 rounded-md bg-slate-100">
                <div
                  className="absolute top-1 bottom-1 rounded-md bg-orange-400/90"
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${task.progressPercent}%`}
                />
                <div
                  className="absolute top-1 bottom-1 rounded-l-md bg-orange-600"
                  style={{ left: `${left}%`, width: `${(width * task.progressPercent) / 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
