type Props = {
  message?: string;
};

export default function LoadingState({ message = "Carregando..." }: Props) {
  return <p className="text-[var(--text-muted)]">{message}</p>;
}
