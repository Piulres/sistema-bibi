type Props = {
  message?: string;
};

export default function LoadingState({ message = "Carregando..." }: Props) {
  return (
    <div
      className="flex items-center gap-3 text-[var(--text-muted)]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--border-muted)] border-t-[var(--portal-accent)]"
        aria-hidden
      />
      <p className="text-sm">{message}</p>
    </div>
  );
}
