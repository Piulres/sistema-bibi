import { cn } from "@/lib/utils/cn";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  padding?: "sm" | "md" | "lg";
};

const paddingClass = {
  sm: "p-4",
  md: "p-5",
  lg: "p-8",
};

export default function Card({
  padding = "md",
  className,
  children,
  ...props
}: Props) {
  return (
    <div className={cn("ds-card", paddingClass[padding], className)} {...props}>
      {children}
    </div>
  );
}
