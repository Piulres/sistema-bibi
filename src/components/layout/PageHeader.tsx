type Props = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export default function PageHeader({ title, description, actions }: Props) {
  return (
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3 sm:gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-[var(--text-secondary)] sm:text-base">{description}</p>
        )}
      </div>
      {actions ? <div className="flex min-w-0 shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
