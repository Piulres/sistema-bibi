import type { Metadata } from "next";
import Link from "next/link";
import { PLATFORM } from "@/lib/platform";
import { PwaInstallGuide } from "@/components/pwa/PwaInstallGuide";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Instalar app",
  description: `Adicione o ${PLATFORM.shortName} à tela de início do iPhone ou Android — experiência de aplicativo (PWA).`,
  robots: { index: false, follow: false },
};

export default function InstalarPage() {
  return (
    <main className="relative min-h-full overflow-hidden bg-slate-950 text-slate-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(14,165,233,0.22),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(30,41,59,0.9),_#020617_70%)]"
      />
      <div className="relative mx-auto flex min-h-full max-w-lg flex-col px-6 py-10 sm:py-14">
        <p className="text-sm font-medium tracking-wide text-sky-300/90">
          {PLATFORM.shortName} · v3.0
        </p>
        <h1 className="mt-3 font-sans text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Instalar como app
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-300">
          Use o {PLATFORM.name} em tela cheia no celular — ícone na home, sem barra do
          navegador. Não precisa da App Store.
        </p>

        <PwaInstallGuide />
        <ServiceWorkerRegister />

        <p className="mt-10 text-sm text-slate-400">
          {PLATFORM.shortName} v{PLATFORM.release} — experiência de aplicativo no
          celular (PWA).
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex text-sm font-medium text-sky-300 underline-offset-4 hover:underline"
        >
          Voltar à home
        </Link>
      </div>
    </main>
  );
}
