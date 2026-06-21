import Link from "next/link";

const portals = [
  {
    href: "/login",
    label: "Portal do Prestador",
    desc: "Agenda inteligente e prontuário eletrônico (PEP).",
    accent: "from-teal-500 to-emerald-600",
    icon: "🩺",
  },
  {
    href: "/interno/login",
    label: "Portal Interno",
    desc: "Faturamento Pay Per Use e administração.",
    accent: "from-indigo-500 to-blue-600",
    icon: "💼",
  },
  {
    href: "/pj/login",
    label: "Portal da Empresa",
    desc: "Gestão de contratos e beneficiários corporativos.",
    accent: "from-fuchsia-500 to-purple-600",
    icon: "🏢",
  },
  {
    href: "/beneficiario/login",
    label: "Portal do Beneficiário",
    desc: "Agenda, consumo Pay Per Use, faturas e assinatura.",
    accent: "from-teal-500 to-cyan-600",
    icon: "👤",
  },
];

const pillars = [
  { title: "Pay Per Use", text: "O beneficiário paga apenas pelos serviços efetivamente utilizados, com transparência prévia de valores." },
  { title: "Previsibilidade financeira", text: "Faturamento fechado na alta, sem perdas de informação e sem burocracia." },
  { title: "Mobile-first & LGPD", text: "100% em nuvem, acessível de qualquer dispositivo e em conformidade com a LGPD." },
];

export default function Home() {
  return (
    <main className="flex-1">
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 text-white">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-teal-200">
            HealthTech · SaaS · Gestão Inteligente
          </p>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Sistema Bibi
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-200">
            Plataforma de gestão para clínicas e hospitais focada na extinção da
            burocracia, previsibilidade financeira e fidelização de pacientes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-teal-400 px-5 py-3 font-semibold text-slate-900 transition hover:bg-teal-300"
            >
              Acessar Portal do Prestador
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Selecione seu portal
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {portals.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${p.accent} text-2xl`}
              >
                {p.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{p.label}</h3>
              <p className="mt-1 text-sm text-slate-600">{p.desc}</p>
              <span className="mt-4 inline-block text-sm font-medium text-teal-700 group-hover:underline">
                Entrar →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-12 grid gap-6 sm:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title}>
              <h3 className="font-semibold text-slate-900">{p.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{p.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
