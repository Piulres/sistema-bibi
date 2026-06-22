type Props = {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export default function LandingSectionHeader({
  id,
  eyebrow,
  title,
  description,
  align = "left",
}: Props) {
  const centered = align === "center";

  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--brand-primary)] shadow-sm">
        <span
          className="h-1.5 w-1.5 rounded-full bg-[var(--brand-accent)]"
          aria-hidden
        />
        {eyebrow}
      </p>
      <h2
        {...(id ? { id } : {})}
        className="mt-4 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
