export type UtmParams = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
};

const UTM_KEYS = {
  source: "utm_source",
  medium: "utm_medium",
  campaign: "utm_campaign",
  content: "utm_content",
  term: "utm_term",
} as const satisfies Record<keyof UtmParams, string>;

const STORAGE_KEY = "bibi_campaign_utm";

/** Extrai UTM de query string ou objeto URLSearchParams. */
export function parseUtmParams(
  input: string | URLSearchParams,
): UtmParams {
  const params =
    typeof input === "string" ? new URLSearchParams(input) : input;

  const result: UtmParams = {};
  for (const [key, param] of Object.entries(UTM_KEYS) as [keyof UtmParams, string][]) {
    const value = params.get(param)?.trim();
    if (value) result[key] = value;
  }
  return result;
}

export function hasUtmParams(utm: UtmParams): boolean {
  return Object.values(utm).some(Boolean);
}

/** Anexa UTM a uma URL absoluta ou relativa. */
export function appendUtmToUrl(url: string, utm: UtmParams): string {
  if (!hasUtmParams(utm)) return url;

  const isAbsolute = /^https?:\/\//i.test(url);
  const base = isAbsolute ? undefined : "http://local";
  const parsed = new URL(url, base);

  for (const [key, param] of Object.entries(UTM_KEYS) as [keyof UtmParams, string][]) {
    const value = utm[key];
    if (value) parsed.searchParams.set(param, value);
  }

  if (!isAbsolute) {
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }
  return parsed.toString();
}

/** Linha legível para mensagem WhatsApp / CRM. */
export function formatUtmForMessage(utm: UtmParams): string | null {
  const parts: string[] = [];
  if (utm.campaign) parts.push(`Campanha: ${utm.campaign}`);
  if (utm.source) parts.push(`Origem: ${utm.source}`);
  if (utm.medium) parts.push(`Canal: ${utm.medium}`);
  if (utm.content) parts.push(`Conteúdo: ${utm.content}`);
  if (utm.term) parts.push(`Termo: ${utm.term}`);
  return parts.length > 0 ? parts.join(" | ") : null;
}

/** Combina mensagem base com contexto de campanha. */
export function buildWhatsAppMessage(baseMessage: string, utm: UtmParams): string {
  const campaignLine = formatUtmForMessage(utm);
  if (!campaignLine) return baseMessage;
  return `${baseMessage}\n\n[${campaignLine}]`;
}

export function readStoredUtm(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as UtmParams;
  } catch {
    return {};
  }
}

export function storeUtm(utm: UtmParams): void {
  if (typeof window === "undefined" || !hasUtmParams(utm)) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utm));
  } catch {
    // sessionStorage indisponível (modo privado, quota)
  }
}

export function mergeUtm(stored: UtmParams, incoming: UtmParams): UtmParams {
  return { ...stored, ...incoming };
}
