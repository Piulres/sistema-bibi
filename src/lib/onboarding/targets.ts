/** Seletores padronizados para hotspots do tour. */
export const TOUR = {
  header: '[data-tour-id="portal-header"]',
  nav: '[data-tour-id="portal-nav"]',
  content: '[data-tour-id="portal-content"]',
  assistant: '[data-tour-id="portal-assistant"]',
  navTab: (key: string) => `[data-tour-nav="${key}"]`,
  hotspot: (id: string) => `[data-tour-id="${id}"]`,
  section: (id: string) => `[data-tour-id="section-${id}"]`,
} as const;
