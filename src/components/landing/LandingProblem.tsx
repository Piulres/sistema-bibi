import LandingSectionHeader from "@/components/landing/LandingSectionHeader";
import Card from "@/components/ui/Card";

const PROBLEMS = [
  {
    title: "Sinistralidade opaca",
    description:
      "Planos fechados cobram por elegibilidade, não por uso real — o RH paga por centenas de vidas que nunca consultam.",
  },
  {
    title: "Operação fragmentada",
    description:
      "Agenda, prontuário, faturamento e portais do cliente em sistemas desconectados geram retrabalho e perda de receita.",
  },
  {
    title: "White label limitado",
    description:
      "Plataformas genéricas não adaptam vocabulário nem identidade visual por segmento — saúde, pet, jurídico e educação no mesmo molde.",
  },
] as const;

export default function LandingProblem() {
  return (
    <section
      id="problema"
      aria-labelledby="problem-heading"
      className="mx-auto max-w-6xl px-6 py-24"
    >
      <LandingSectionHeader
        id="problem-heading"
        eyebrow="O problema"
        title="Gestão de serviços profissionais ainda é uma caixa preta"
        description="Operações de médio porte perdem visibilidade de consumo, margem e experiência do cliente final."
      />

      <ul className="mt-14 grid gap-5 sm:grid-cols-3">
        {PROBLEMS.map((item) => (
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
