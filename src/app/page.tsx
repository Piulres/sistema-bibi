import Link from "next/link";
import { getPlatformBranding } from "@/lib/theme/branding";
import { PORTAL_THEMES } from "@/lib/theme/portals";
import TenantTheme from "@/components/layout/TenantTheme";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const portals = [
  {
    href: "/login",
    key: "prestador" as const,
    desc: "Agenda inteligente e prontuário eletrônico (PEP).",
    icon: "🩺",
  },
  {
    href: "/interno/login",
    key: "interno" as const,
    desc: "Dashboard executivo, faturamento, CRM, recorrência e comunicação.",
    icon: "💼",
  },
  {
    href: "/pj/login",
    key: "pj" as const,
    desc: "Gestão de contratos e beneficiários corporativos.",
    icon: "🏢",
  },
  {
    href: "/beneficiario/login",
    key: "beneficiario" as const,
    desc: "Agenda, consumo Pay Per Use, faturas e assinatura.",
    icon: "👤",
  },
];

const pillars = [
  {
    title: "Pay Per Use",
    text: "O beneficiário paga apenas pelos serviços efetivamente utilizados, com transparência prévia de valores.",
  },
  {
    title: "Previsibilidade financeira",
    text: "Faturamento fechado na alta, sem perdas de informação e sem burocracia.",
  },
  {
    title: "White label & LGPD",
    text: "Identidade visual por tenant, 100% em nuvem e em conformidade com a LGPD.",
  },
];

export default async function Home() {
  const branding = await getPlatformBranding();

  return (
    <TenantTheme branding={branding} className="flex flex-1 flex-col">
      <section className="ds-gradient-brand text-[var(--text-inverse)]">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white/80">
            HealthTech · SaaS · White Label
          </p>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            {branding.displayName}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            {branding.tagline ??
              "Plataforma de gestão para clínicas e hospitais focada na extinção da burocracia, previsibilidade financeira e fidelização de pacientes."}
          </p>
          <p className="mt-3 max-w-2xl text-sm text-white/60">
            Cada tenant opera com marca própria — logo, cores e nome de exibição — sobre a
            infraestrutura {branding.platformLabel}.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login">
              <Button size="lg" className="bg-[var(--brand-accent)] text-[var(--surface-inverse)] hover:opacity-90">
                Acessar Portal do Prestador
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Selecione seu portal
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {portals.map((p) => {
            const theme = PORTAL_THEMES[p.key];
            return (
              <Link key={p.href} href={p.href} className="group">
                <Card className="h-full transition hover:-translate-y-1 hover:shadow-md">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl text-[var(--text-inverse)]"
                    style={{
                      background: `linear-gradient(to bottom right, ${theme.accentFrom}, ${theme.accentTo})`,
                    }}
                  >
                    {p.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
                    {theme.label}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{p.desc}</p>
                  <span className="mt-4 inline-block text-sm font-medium text-[var(--brand-primary)] group-hover:underline">
                    Entrar →
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-t border-[var(--border-default)] bg-[var(--surface-card)]">
        <div className="mx-auto max-w-5xl px-6 py-12 grid gap-6 sm:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title}>
              <h3 className="font-semibold text-[var(--text-primary)]">{p.title}</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{p.text}</p>
            </div>
          ))}
        </div>
      </section>
    </TenantTheme>
  );
}
