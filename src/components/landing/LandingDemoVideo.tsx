import Link from "next/link";
import LandingSectionHeader from "@/components/landing/LandingSectionHeader";
import LandingIcon from "@/components/landing/LandingIcon";
import { landingCtaClasses } from "@/components/landing/landing-cta";

const DEMO_VIDEO_URL = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL?.trim() ?? "";

function youtubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export default function LandingDemoVideo() {
  const embed = DEMO_VIDEO_URL ? youtubeEmbedUrl(DEMO_VIDEO_URL) : null;

  return (
    <section
      id="demo-video"
      aria-labelledby="demo-video-heading"
      className="mx-auto max-w-6xl px-6 py-16"
    >
      <LandingSectionHeader
        id="demo-video-heading"
        eyebrow="Demonstração"
        title="Veja o ServiceOS em ação"
        description={
          embed
            ? "Tour em vídeo da plataforma — quatro portais, Pay Per Use e white label."
            : "Explore os portais ao vivo na demonstração interativa — vídeo em breve ou configure NEXT_PUBLIC_DEMO_VIDEO_URL."
        }
      />

      <div className="mt-10 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm">
        {embed ? (
          <div className="aspect-video w-full">
            <iframe
              title="Demonstração Sistema Bibi - ServiceOS"
              src={embed}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="landing-mesh-hero flex flex-col items-center justify-center px-8 py-16 text-center text-[var(--text-inverse)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <LandingIcon name="portals" className="h-8 w-8 text-[var(--brand-accent)]" />
            </div>
            <p className="mt-6 max-w-md text-lg text-white/85">
              Demonstração interativa com massa real — faturamento, Portal PJ, agendamento e
              calculadora ROI.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="#portais" className={landingCtaClasses("hero", "lg")}>
                Abrir demonstração ao vivo
              </Link>
              <Link href="#roi" className={landingCtaClasses("hero-ghost", "lg")}>
                Simular economia
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
