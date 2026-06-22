"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/** Barra de progresso no topo durante transições de rota SPA. */
export default function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      setVisible(true);
      setProgress(0);
      requestAnimationFrame(() => {
        if (!cancelled) setProgress(30);
      });
      timerRef.current = setTimeout(() => {
        if (!cancelled) setProgress(70);
      }, 120);
      setTimeout(() => {
        if (cancelled) return;
        setProgress(100);
        setTimeout(() => {
          if (!cancelled) setVisible(false);
        }, 200);
      }, 280);
    };

    const raf = requestAnimationFrame(start);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 bg-transparent"
      role="progressbar"
      aria-hidden
    >
      <div
        className="h-full bg-[var(--portal-accent)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
