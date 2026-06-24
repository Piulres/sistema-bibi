import { cn } from "@/lib/utils/cn";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  padding?: "sm" | "md" | "lg";
  accent?: boolean;
};

const paddingClass = {
  sm: "p-4",
  md: "p-5",
  lg: "p-8",
};

export default function Card({
  padding = "md",
  accent = false,
  className,
  children,
  ...props
}: Props) {
  return (
    <div
      className={cn(
        "ds-card",
        paddingClass[padding],
        accent && "border-l-4 border-l-[var(--brand-accent)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
