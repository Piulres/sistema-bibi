type Props = {
  title: string;
  description?: string;
};

export default function SectionHeader({ title, description }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
      )}
    </div>
  );
}
