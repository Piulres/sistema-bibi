import type { RoiSegmentKey } from "@/lib/landing/roi-calculator";
import { ROI_SEGMENT_PRESETS } from "@/lib/landing/roi-calculator";
import type { UtmParams } from "@/lib/marketing/utm";
import { buildWhatsAppMessage } from "@/lib/marketing/utm";

export type LeadFormData = {
  name: string;
  company: string;
  email: string;
  segment: RoiSegmentKey;
  eligibleCount?: number;
  message?: string;
};

export function buildLeadWhatsAppMessage(
  data: LeadFormData,
  utm: UtmParams = {},
): string {
  const segmentLabel = ROI_SEGMENT_PRESETS[data.segment].label;
  const lines = [
    "Olá! Quero conhecer o ServiceOS.",
    "",
    `Nome: ${data.name.trim()}`,
    `Empresa: ${data.company.trim()}`,
    `E-mail: ${data.email.trim()}`,
    `Segmento: ${segmentLabel}`,
  ];

  if (data.eligibleCount && data.eligibleCount > 0) {
    lines.push(`Elegíveis: ${data.eligibleCount}`);
  }
  if (data.message?.trim()) {
    lines.push("", `Mensagem: ${data.message.trim()}`);
  }

  return buildWhatsAppMessage(lines.join("\n"), utm);
}
