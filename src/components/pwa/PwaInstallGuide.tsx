"use client";

import { useEffect, useState } from "react";
import { isStandaloneDisplay } from "@/lib/pwa/install";

type PlatformHint = "ios" | "android" | "other";

function detectPlatform(): PlatformHint {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

export function PwaInstallGuide() {
  const [platform, setPlatform] = useState<PlatformHint>("other");
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setPlatform(detectPlatform());
      setStandalone(isStandaloneDisplay());
    });
    return () => cancelAnimationFrame(id);
  }, []);

  if (standalone) {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
        Você já está no modo aplicativo. Pode navegar pelos portais normalmente.
      </div>
    );
  }

  return (
    <ol className="mt-8 space-y-4 text-sm leading-relaxed text-slate-200">
      {platform === "ios" && (
        <>
          <li className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <span className="font-medium text-white">1.</span> Abra este site no{" "}
            <strong className="text-white">Safari</strong> (não use Chrome no iPhone
            para instalar).
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <span className="font-medium text-white">2.</span> Toque em{" "}
            <strong className="text-white">Compartilhar</strong> (quadrado com seta
            para cima).
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <span className="font-medium text-white">3.</span> Escolha{" "}
            <strong className="text-white">Adicionar à Tela de Início</strong> →
            Adicionar.
          </li>
        </>
      )}
      {platform === "android" && (
        <>
          <li className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <span className="font-medium text-white">1.</span> Abra no{" "}
            <strong className="text-white">Chrome</strong>.
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <span className="font-medium text-white">2.</span> Menu (⋮) →{" "}
            <strong className="text-white">Instalar app</strong> ou{" "}
            <strong className="text-white">Adicionar à tela inicial</strong>.
          </li>
        </>
      )}
      {platform === "other" && (
        <li className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
          No iPhone use o Safari → Compartilhar → Adicionar à Tela de Início. No
          Android, Chrome → Instalar app.
        </li>
      )}
    </ol>
  );
}
