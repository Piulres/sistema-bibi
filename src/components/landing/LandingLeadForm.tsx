"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LandingSectionHeader from "@/components/landing/LandingSectionHeader";
import {
  ROI_SEGMENT_PRESETS,
  type RoiSegmentKey,
} from "@/lib/landing/roi-calculator";
import { buildLeadWhatsAppMessage } from "@/lib/landing/lead-form";
import {
  getSalesWhatsAppConfig,
  buildWhatsAppUrl,
} from "@/lib/landing/whatsapp";
import {
  mergeUtm,
  parseUtmParams,
  readStoredUtm,
  hasUtmParams,
} from "@/lib/marketing/utm";
import { pushDataLayer } from "@/lib/marketing/data-layer";

const SEGMENT_KEYS = Object.keys(ROI_SEGMENT_PRESETS) as RoiSegmentKey[];

export default function LandingLeadForm() {
  return (
    <Suspense fallback={null}>
      <LandingLeadFormInner />
    </Suspense>
  );
}

function LandingLeadFormInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const config = getSalesWhatsAppConfig();

  const utm = useMemo(() => {
    const incoming = parseUtmParams(searchParams);
    const stored = readStoredUtm();
    return hasUtmParams(incoming) ? mergeUtm(stored, incoming) : stored;
  }, [searchParams]);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [segment, setSegment] = useState<RoiSegmentKey>("MEDICAL");
  const [eligibleCount, setEligibleCount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!config) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !company.trim() || !email.trim()) {
      setError("Preencha nome, empresa e e-mail.");
      return;
    }
    if (!email.includes("@")) {
      setError("Informe um e-mail válido.");
      return;
    }

    const eligible = eligibleCount ? Number(eligibleCount) : undefined;
    const waMessage = buildLeadWhatsAppMessage(
      {
        name,
        company,
        email,
        segment,
        eligibleCount: eligible,
        message,
      },
      utm,
    );

    pushDataLayer({
      event: "lead_form_submit",
      segment,
      page_path: pathname,
      utm: Object.keys(utm).length > 0 ? utm : undefined,
    });

    const href = buildWhatsAppUrl(config.number, waMessage);
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <section
      id="contato"
      aria-labelledby="contato-heading"
      className="mx-auto max-w-6xl px-6 py-24"
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <div>
          <LandingSectionHeader
            id="contato-heading"
            eyebrow="Contato"
            title="Fale com um especialista"
            description="Qualifique seu interesse em 30 segundos — abrimos o WhatsApp com sua mensagem e contexto da campanha (UTM) pré-preenchidos."
          />
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Sem backend de CRM nesta POC: o lead vai direto para o WhatsApp comercial. Configure{" "}
            <code className="text-xs">NEXT_PUBLIC_SALES_WHATSAPP</code> no ambiente.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-sm"
        >
          <div className="space-y-4">
            <Input
              label="Nome"
              name="name"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Empresa"
              name="company"
              required
              autoComplete="organization"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <Input
              label="E-mail corporativo"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div>
              <label
                htmlFor="lead-segment"
                className="text-sm font-medium text-[var(--text-secondary)]"
              >
                Segmento de interesse
              </label>
              <select
                id="lead-segment"
                value={segment}
                onChange={(e) => setSegment(e.target.value as RoiSegmentKey)}
                className="mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
              >
                {SEGMENT_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {ROI_SEGMENT_PRESETS[key].label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Elegíveis (opcional)"
              name="eligible"
              type="number"
              min={1}
              placeholder="Ex.: 500 colaboradores"
              value={eligibleCount}
              onChange={(e) => setEligibleCount(e.target.value)}
            />
            <div>
              <label
                htmlFor="lead-message"
                className="text-sm font-medium text-[var(--text-secondary)]"
              >
                Mensagem (opcional)
              </label>
              <textarea
                id="lead-message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
                placeholder="Conte brevemente seu cenário (vidas, uso atual, dores)..."
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 text-sm text-[var(--status-danger-text)]" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" variant="accent" size="lg" className="mt-6 w-full">
            Enviar e abrir WhatsApp
          </Button>
        </form>
      </div>
    </section>
  );
}
