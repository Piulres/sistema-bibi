"use client";

import { useEffect } from "react";

type SwaggerBundle = {
  (config: Record<string, unknown>): unknown;
  presets: { apis: unknown };
};

declare global {
  interface Window {
    SwaggerUIBundle?: SwaggerBundle;
  }
}

function loadStylesheet(href: string) {
  if (document.querySelector(`link[data-swagger-ui="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute("data-swagger-ui", href);
  document.head.appendChild(link);
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[data-swagger-ui="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.setAttribute("data-swagger-ui", src);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    document.body.appendChild(script);
  });
}

export default function SwaggerUi() {
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      loadStylesheet("/swagger-ui/swagger-ui.css");
      await loadScript("/swagger-ui/swagger-ui-bundle.js");
      if (cancelled || !window.SwaggerUIBundle) return;

      window.SwaggerUIBundle({
        url: "/openapi.yaml",
        dom_id: "#swagger-ui",
        deepLinking: true,
        withCredentials: true,
        presets: [window.SwaggerUIBundle.presets.apis],
        layout: "BaseLayout",
        validatorUrl: null,
      });
    };

    void boot().catch((err) => {
      console.error("Swagger UI:", err);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <header className="border-b border-slate-200 bg-gradient-to-br from-slate-800 to-amber-500 px-6 py-4 text-white">
        <h1 className="text-lg font-semibold">Sistema Bibi - ServiceOS — Documentação da API</h1>
        <p className="mt-1 text-sm text-teal-100">
          OpenAPI 3.0 · autenticação por cookie de sessão (
          <code className="rounded bg-white/10 px-1">bibi_session</code>) · faça login em{" "}
          <code className="rounded bg-white/10 px-1">POST /api/auth/login</code>
        </p>
        <p className="mt-2 text-xs text-white/80">
          Spec YAML:{" "}
          <a className="underline" href="/openapi.yaml">
            /openapi.yaml
          </a>
        </p>
      </header>
      <div id="swagger-ui" />
    </>
  );
}
