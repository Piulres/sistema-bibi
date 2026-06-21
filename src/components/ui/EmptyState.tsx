import Card from "@/components/ui/Card";

type Props = {
  message: string;
};

export default function EmptyState({ message }: Props) {
  return (
    <Card padding="sm" className="mt-4 text-[var(--text-muted)]">
      {message}
    </Card>
  );
}
