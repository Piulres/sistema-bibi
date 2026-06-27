"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import Button from "@/components/ui/Button";
import { useOnboarding } from "@/components/onboarding/OnboardingProvider";
import type { OnboardingPlacement } from "@/lib/onboarding/types";

type Rect = { top: number; left: number; width: number; height: number };

const PADDING = 8;
const TOOLTIP_GAP = 12;
const PROGRESS_BAR_THRESHOLD = 8;

function getTargetRect(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function computeTooltipPosition(
  target: Rect,
  tooltipW: number,
  tooltipH: number,
  placement: OnboardingPlacement,
): { top: number; left: number; resolved: OnboardingPlacement } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const candidates: OnboardingPlacement[] =
    placement === "auto"
      ? ["bottom", "top", "right", "left"]
      : [placement, "bottom", "top", "right", "left"];

  for (const p of candidates) {
    let top = 0;
    let left = 0;

    switch (p) {
      case "bottom":
        top = target.top + target.height + PADDING + TOOLTIP_GAP;
        left = target.left + target.width / 2 - tooltipW / 2;
        break;
      case "top":
        top = target.top - PADDING - TOOLTIP_GAP - tooltipH;
        left = target.left + target.width / 2 - tooltipW / 2;
        break;
      case "right":
        top = target.top + target.height / 2 - tooltipH / 2;
        left = target.left + target.width + PADDING + TOOLTIP_GAP;
        break;
      case "left":
        top = target.top + target.height / 2 - tooltipH / 2;
        left = target.left - PADDING - TOOLTIP_GAP - tooltipW;
        break;
    }

    if (top >= 8 && left >= 8 && top + tooltipH <= vh - 8 && left + tooltipW <= vw - 8) {
      return { top, left, resolved: p };
    }
  }

  return {
    top: Math.min(vh - tooltipH - 16, Math.max(16, target.top + target.height + TOOLTIP_GAP)),
    left: Math.min(vw - tooltipW - 16, Math.max(16, target.left)),
    resolved: "bottom",
  };
}

/** Overlay com spotlight e tooltip guiado — product tour. */
export default function OnboardingTour() {
  const router = useRouter();
  const { active, tourMode, currentStep, currentIndex, totalSteps, nextStep, prevStep, endTour } =
    useOnboarding();
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [resolvedPlacement, setResolvedPlacement] = useState<OnboardingPlacement>("bottom");
  const tooltipRef = useRef<HTMLDivElement>(null);
  const mounted = typeof document !== "undefined";

  const updatePosition = useCallback(() => {
    if (!currentStep) return;
    const rect = getTargetRect(currentStep.target);
    setTargetRect(rect);

    if (rect && tooltipRef.current) {
      const tw = tooltipRef.current.offsetWidth;
      const th = tooltipRef.current.offsetHeight;
      const pos = computeTooltipPosition(rect, tw, th, currentStep.placement ?? "auto");
      setTooltipPos({ top: pos.top, left: pos.left });
      setResolvedPlacement(pos.resolved);
    }
  }, [currentStep]);

  useLayoutEffect(() => {
    if (!active || !currentStep) return;

    let cancelled = false;
    requestAnimationFrame(() => {
      if (cancelled) return;
      const rect = getTargetRect(currentStep.target);
      if (!rect) {
        nextStep();
        return;
      }
      updatePosition();
      const el = document.querySelector(currentStep.target);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    });

    return () => {
      cancelled = true;
    };
  }, [active, currentStep, updatePosition, nextStep]);

  useEffect(() => {
    if (!active) return;
    const onResize = () => {
      requestAnimationFrame(() => updatePosition());
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [active, updatePosition]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") endTour(false);
      if (e.key === "ArrowRight") nextStep();
      if (e.key === "ArrowLeft") prevStep();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, endTour, nextStep, prevStep]);

  if (!mounted || !active || !currentStep) return null;

  const isLast = currentIndex >= totalSteps - 1;
  const titleId = `onboarding-title-${currentStep.id}`;
  const bodyId = `onboarding-body-${currentStep.id}`;
  const spotlight = targetRect
    ? {
        top: targetRect.top - PADDING,
        left: targetRect.left - PADDING,
        width: targetRect.width + PADDING * 2,
        height: targetRect.height + PADDING * 2,
      }
    : null;

  function handleNavigate() {
    if (!currentStep?.navigateTo) return;
    router.push(currentStep.navigateTo);
    nextStep();
  }

  return createPortal(
    <div
      className="onboarding-root"
      role="dialog"
      aria-modal="true"
      aria-label={tourMode === "micro" ? "Tour do módulo" : "Tour guiado"}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
    >
      <div className="onboarding-backdrop" onClick={() => endTour(false)} aria-hidden />

      {spotlight ? (
        <div
          className="onboarding-spotlight"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
        >
          <span className="onboarding-hotspot-pulse" aria-hidden />
        </div>
      ) : null}

      <div
        ref={tooltipRef}
        className="onboarding-tooltip"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
        data-placement={resolvedPlacement}
        role="document"
      >
        <div className="onboarding-tooltip-header">
          <span className="onboarding-step-badge">
            {tourMode === "micro" ? "Módulo · " : ""}
            {currentIndex + 1} / {totalSteps}
          </span>
          <button
            type="button"
            className="onboarding-close"
            onClick={() => endTour(false)}
            aria-label="Fechar tour"
          >
            ×
          </button>
        </div>
        <h3 id={titleId} className="onboarding-tooltip-title">
          {currentStep.title}
        </h3>
        <p id={bodyId} className="onboarding-tooltip-body whitespace-pre-line">
          {currentStep.content}
        </p>
        <div className="onboarding-tooltip-actions">
          <div className="flex flex-wrap items-center gap-2">
            {currentIndex > 0 ? (
              <Button variant="ghost" size="sm" onClick={prevStep}>
                Anterior
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => endTour(false)}>
                Pular
              </Button>
            )}
            {currentStep.navigateTo ? (
              <Button variant="secondary" size="sm" onClick={handleNavigate}>
                Ir para módulo
              </Button>
            ) : null}
          </div>
          <Button variant="portal" size="sm" onClick={nextStep}>
            {isLast ? "Concluir" : "Próximo"}
          </Button>
        </div>
        {totalSteps > PROGRESS_BAR_THRESHOLD ? (
          <div
            className="onboarding-progress-bar"
            role="progressbar"
            aria-valuenow={currentIndex + 1}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-label="Progresso do tour"
          >
            <span
              className="onboarding-progress-bar-fill"
              style={{ width: `${((currentIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>
        ) : (
          <div className="onboarding-progress">
            {Array.from({ length: totalSteps }, (_, i) => (
              <span
                key={i}
                className={i === currentIndex ? "onboarding-dot active" : "onboarding-dot"}
                aria-hidden
              />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
