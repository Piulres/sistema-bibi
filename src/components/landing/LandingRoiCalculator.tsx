"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import LandingSectionHeader from "@/components/landing/LandingSectionHeader";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import {
  ROI_SEGMENT_PRESETS,
  computeRoi,
  formatBrl,
  formatPct,
  type RoiSegmentKey,
} from "@/lib/landing/roi-calculator";
import { pushDataLayer } from "@/lib/marketing/data-layer";

const SEGMENT_KEYS = Object.keys(ROI_SEGMENT_PRESETS) as RoiSegmentKey[];

export default function LandingRoiCalculator() {
  const pathname = usePathname();
  const [segment, setSegment] = useState<RoiSegmentKey>("MEDICAL");
  const preset = ROI_SEGMENT_PRESETS[segment];

  const [eligible, setEligible] = useState(preset.defaultEligible);
  const [utilizationPct, setUtilizationPct] = useState(preset.defaultUtilizationPct);
  const [traditionalTicket, setTraditionalTicket] = useState(preset.traditionalTicket);
  const [unitPrice, setUnitPrice] = useState(preset.unitPrice);
  const [platformFee, setPlatformFee] = useState(preset.platformFee);

  const trackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const result = useMemo(
    () =>
      computeRoi({
        eligible,
        utilizationPct,
        traditionalTicket,
        unitPrice,
        platformFee,
      }),
    [eligible, utilizationPct, traditionalTicket, unitPrice, platformFee],
  );

  const trackCalculator = useCallback(
    (nextSegment: RoiSegmentKey) => {
      const r = computeRoi({
        eligible,
        utilizationPct,
        traditionalTicket,
        unitPrice,
        platformFee,
      });
      pushDataLayer({
        event: "roi_calculator_change",
        segment: nextSegment,
        eligible,
        utilization_pct: utilizationPct,
        savings_pct: Math.round(r.savingsPct * 10) / 10,
        page_path: pathname,
      });
    },
    [eligible, utilizationPct, traditionalTicket, unitPrice, platformFee, pathname],
  );

  useEffect(() => {
    if (trackTimeout.current) clearTimeout(trackTimeout.current);
    trackTimeout.current = setTimeout(() => trackCalculator(segment), 600);
    return () => {
      if (trackTimeout.current) clearTimeout(trackTimeout.current);
    };
  }, [segment, eligible, utilizationPct, traditionalTicket, unitPrice, platformFee, trackCalculator]);

  function applyPreset(key: RoiSegmentKey) {
    const next = ROI_SEGMENT_PRESETS[key];
    setSegment(key);
    setEligible(next.defaultEligible);
    setUtilizationPct(next.defaultUtilizationPct);
    setTraditionalTicket(next.traditionalTicket);
    setUnitPrice(next.unitPrice);
    setPlatformFee(next.platformFee);
  }

  return (
    <section id="roi" aria-labelledby="roi-heading" className="mx-auto max-w-6xl px-6 py-24">
      <LandingSectionHeader
        id="roi-heading"
        eyebrow="ROI demonstrável"
        title="Simule a economia do Pay Per Use"
        description="Ajuste colaboradores, utilização e tickets — cenário modelado, não promessa contratual. Fonte: ROI de referência do seed."
      />

      <div className="mt-10 flex flex-wrap gap-2" role="tablist" aria-label="Segmento da calculadora">
        {SEGMENT_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={segment === key}
            onClick={() => applyPreset(key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] ${
              segment === key
                ? "bg-[var(--brand-primary)] text-white"
                : "border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:border-[var(--brand-accent)]"
            }`}
          >
            {ROI_SEGMENT_PRESETS[key].label}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Premissas</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Segmento: <strong>{preset.label}</strong> · unidade: {preset.unitLabel}
          </p>

          <div className="mt-6 space-y-4">
            <Input
              label={preset.eligibleLabel}
              type="number"
              min={1}
              max={10000}
              value={eligible}
              onChange={(e) => setEligible(Number(e.target.value) || 0)}
            />
            <div>
              <label
                htmlFor="utilization"
                className="text-sm font-medium text-[var(--text-secondary)]"
              >
                Utilização mensal ({utilizationPct}% — {result.unitsPerMonth}{" "}
                {preset.unitLabel}
                {result.unitsPerMonth === 1 ? "" : "s"}/mês)
              </label>
              <input
                id="utilization"
                type="range"
                min={1}
                max={100}
                value={utilizationPct}
                onChange={(e) => setUtilizationPct(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--brand-accent)]"
              />
            </div>
            <Input
              label="Ticket tradicional (R$/mês por elegível)"
              type="number"
              min={0}
              value={traditionalTicket}
              onChange={(e) => setTraditionalTicket(Number(e.target.value) || 0)}
            />
            <Input
              label={`Preço por ${preset.unitLabel} (Price Snapshot)`}
              type="number"
              min={0}
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value) || 0)}
            />
            <Input
              label="Taxa plataforma (R$/mês)"
              type="number"
              min={0}
              value={platformFee}
              onChange={(e) => setPlatformFee(Number(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--surface-muted)]">
                  <th className="px-6 py-4 font-semibold text-[var(--text-primary)]">Modelo</th>
                  <th className="px-6 py-4 font-semibold text-[var(--text-primary)]">Custo/mês</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--border-default)]">
                  <td className="px-6 py-5 text-[var(--text-secondary)]">Plano fechado</td>
                  <td className="px-6 py-5 text-lg font-bold text-[var(--text-primary)]">
                    {formatBrl(result.traditionalMonthly)}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-[var(--text-primary)]">
                        Sistema Bibi - ServiceOS
                      </span>
                      <Badge tone="accent">Recomendado</Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {result.unitsPerMonth} × {formatBrl(unitPrice)} + {formatBrl(platformFee)}{" "}
                      plataforma
                    </p>
                  </td>
                  <td className="px-6 py-5 text-lg font-bold text-[var(--brand-primary)]">
                    {formatBrl(result.ppuTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/5 p-6 text-center">
            <p className="text-sm font-medium text-[var(--text-secondary)]">Economia estimada</p>
            <p className="mt-2 text-4xl font-bold tracking-tight text-[var(--brand-accent)]">
              {formatPct(result.savingsPct)}
            </p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {formatBrl(result.savingsMonthly)}/mês · {formatBrl(result.savingsAnnual)}/ano
            </p>
            <p className="mt-4 text-xs text-[var(--text-muted)]">
              Cenário modelado — validar escopo clínico/operacional em piloto.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
