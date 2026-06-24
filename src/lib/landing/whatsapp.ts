/** Normaliza número E.164 para wa.me (somente dígitos, sem +). */
export function normalizeWhatsAppNumber(raw: string): string {
  return raw.replace(/\D/g, "");
}

export type SalesWhatsAppConfig = {
  number: string;
  defaultMessage: string;
};

const DEFAULT_MESSAGE =
  "Olá! Gostaria de falar com um especialista sobre o ServiceOS.";

/** Configuração comercial do WhatsApp a partir das env vars públicas. */
export function getSalesWhatsAppConfig(): SalesWhatsAppConfig | null {
  const raw = process.env.NEXT_PUBLIC_SALES_WHATSAPP?.trim();
  if (!raw) return null;

  const number = normalizeWhatsAppNumber(raw);
  if (number.length < 10) return null;

  const defaultMessage =
    process.env.NEXT_PUBLIC_SALES_WHATSAPP_MESSAGE?.trim() || DEFAULT_MESSAGE;

  return { number, defaultMessage };
}

/** Monta URL wa.me com mensagem opcional. */
export function buildWhatsAppUrl(number: string, message?: string): string {
  const base = `https://wa.me/${normalizeWhatsAppNumber(number)}`;
  if (!message?.trim()) return base;
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}
