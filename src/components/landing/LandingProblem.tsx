import LandingSectionHeader from "@/components/landing/LandingSectionHeader";
import Card from "@/components/ui/Card";
import { HOME_PROBLEM } from "@/lib/landing/home-content";

export default function LandingProblem() {
  return (
    <section
      id="problema"
      aria-labelledby="problem-heading"
      className="mx-auto max-w-6xl px-6 py-24"
    >
      <LandingSectionHeader
        id="problem-heading"
        eyebrow={HOME_PROBLEM.eyebrow}
        title={HOME_PROBLEM.title}
        description={HOME_PROBLEM.description}
      />

      <ul className="mt-14 grid gap-5 sm:grid-cols-3">
        {HOME_PROBLEM.items.map((item) => (
          <li key={item.title}>
            <Card accent padding="lg" className="h-full">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {item.description}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
