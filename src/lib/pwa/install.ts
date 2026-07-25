/**
 * Helpers da trilha ServiceOS v3.0 (PWA / app shell).
 * Isolado: não altera PLATFORM.release nem o fluxo v2.4.
 */

export const PWA_INSTALL_PATH = "/instalar" as const;

export const PWA_APPLE = {
  capable: true,
  statusBarStyle: "default" as const,
  title: "ServiceOS",
};

/** true quando o documento roda como app instalado (standalone). */
export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || iosStandalone;
}
