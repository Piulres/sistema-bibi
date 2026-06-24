import LandingSectionHeader from "@/components/landing/LandingSectionHeader";
import Badge from "@/components/ui/Badge";

const ROI_ROWS = [
  {
    model: "Tradicional (plano fechado)",
    cost: "~R$ 175.000",
    detail: "R$ 350/vida × 500 colaboradores — paga por elegibilidade",
    tone: "neutral" as const,
  },
  {
    model: "Sistema Bibi - ServiceOS",
    cost: "~R$ 23.400",
    detail: "75 consultas × R$ 272 + R$ 3.000 plataforma — paga pelo uso real",
    tone: "accent" as const,
  },
] as const;

export default function LandingRoi() {
  return (
    <section id="roi" aria-labelledby="roi-heading" className="mx-auto max-w-6xl px-6 py-24">
      <LandingSectionHeader
        id="roi-heading"
        eyebrow="ROI demonstrável"
        title="Até 87% de economia em operações de médio porte"
        description="Comparativo mensal para empresa com 500 colaboradores e 15% de utilização (75 consultas/mês)."
      />

      <div className="mt-14 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--surface-muted)]">
              <th className="px-6 py-4 font-semibold text-[var(--text-primary)]">Modelo</th>
              <th className="px-6 py-4 font-semibold text-[var(--text-primary)]">Custo mensal</th>
              <th className="hidden px-6 py-4 font-semibold text-[var(--text-primary)] sm:table-cell">
                Lógica
              </th>
            </tr>
          </thead>
          <tbody>
            {ROI_ROWS.map((row) => (
              <tr key={row.model} className="border-b border-[var(--border-default)] last:border-0">
                <td className="px-6 py-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-[var(--text-primary)]">{row.model}</span>
                    {row.tone === "accent" && <Badge tone="accent">Recomendado</Badge>}
                  </div>
                </td>
                <td className="px-6 py-5 text-lg font-bold text-[var(--brand-primary)]">
                  {row.cost}
                </td>
                <td className="hidden px-6 py-5 text-[var(--text-secondary)] sm:table-cell">
                  {row.detail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        Economia estimada de <strong className="text-[var(--brand-accent)]">~87%</strong> com
        transparência de consumo auditável pelo RH.
      </p>
    </section>
  );
}
