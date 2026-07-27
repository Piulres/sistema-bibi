"use client";

import { useEffect } from "react";

/** Registra SW de cache leve — só na página /instalar. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // SW opcional — falha silenciosa fora de HTTPS ou browsers antigos
    });
  }, []);

  return null;
}
