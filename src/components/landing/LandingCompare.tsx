import LandingSectionHeader from "@/components/landing/LandingSectionHeader";
import LandingIcon from "@/components/landing/LandingIcon";
import {
  HOME_COMPARE_FOOTNOTES,
  HOME_COMPARE_INTRO,
  HOME_COMPARE_ROWS,
} from "@/lib/landing/compare-content";

export default function LandingCompare() {
  return (
    <section
      id="comparativo"
      aria-labelledby="compare-heading"
      className="border-y border-[var(--border-default)] bg-[var(--surface-muted)]/50"
    >
      <div className="mx-auto max-w-6xl px-6 py-24">
        <LandingSectionHeader
          id="compare-heading"
          eyebrow="Comparativo"
          title={HOME_COMPARE_INTRO.title}
          description={HOME_COMPARE_INTRO.description}
        />

        <div className="mt-14 overflow-x-auto rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--surface-muted)]">
                <th className="px-5 py-4 font-semibold text-[var(--text-primary)]">Critério</th>
                <th className="px-5 py-4 font-semibold text-[var(--brand-accent)]">
                  ServiceOS
                </th>
                <th className="px-5 py-4 font-semibold text-[var(--text-primary)]">
                  Plano fechado
                </th>
                <th className="px-5 py-4 font-semibold text-[var(--text-primary)]">
                  Mercado típico
                </th>
              </tr>
            </thead>
            <tbody>
              {HOME_COMPARE_ROWS.map((row) => (
                <tr key={row.criterion} className="border-b border-[var(--border-default)] last:border-0">
                  <td className="px-5 py-4 font-medium text-[var(--text-primary)]">
                    {row.criterion}
                  </td>
                  <td className="px-5 py-4 text-[var(--text-secondary)]">
                    <span className="inline-flex items-start gap-2">
                      <LandingIcon
                        name="check"
                        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-accent)]"
                      />
                      {row.serviceos}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[var(--text-muted)]">{row.traditional}</td>
                  <td className="px-5 py-4 text-[var(--text-muted)]">{row.market}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-6 space-y-2">
          {HOME_COMPARE_FOOTNOTES.map((note) => (
            <li key={note} className="text-xs text-[var(--text-muted)]">
              {note}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
