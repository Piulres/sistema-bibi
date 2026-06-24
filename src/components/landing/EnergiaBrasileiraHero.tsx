import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type Props = {
  title: string;
  description: string;
  cta: { label: string; href: string };
  gradient?: boolean;
  className?: string;
};

/** Hero reutilizável com identidade Energia Brasileira (Dark Slate + Orange). */
export function EnergiaBrasileiraHero({
  title,
  description,
  cta,
  gradient = true,
  className,
}: Props) {
  return (
    <section
      className={cn(
        "relative overflow-hidden py-24 md:py-40",
        gradient && "landing-mesh-hero",
        className,
      )}
    >
      <div className="relative mx-auto max-w-3xl px-4 text-white">
        <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">{title}</h1>
        <p className="mb-8 text-lg leading-relaxed text-white/90">{description}</p>
        <Link
          href={cta.href}
          className="inline-flex items-center justify-center rounded-[var(--radius-button)] bg-white px-8 py-3 text-base font-semibold text-[#1e293b] transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2"
        >
          {cta.label}
        </Link>
      </div>
    </section>
  );
}
