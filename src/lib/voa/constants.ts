/** Constantes Voa — seguras para Client Components. */

export const VOA_PLUGIN_SCRIPT_DEFAULT = "https://integration.voa.health/plugin.js";

export const VOA_PLUGIN_EVENTS = {
  EHR_FILL: "voa.plugin.ehr.fill",
  EHR_STRUCTURED_OUTPUT: "voa.plugin.ehr.structured_output",
} as const;

export type VoaConsultationType = "IN_PERSON" | "TELEMEDICINE";

export type VoaMountOptions = {
  darkMode?: boolean;
  allowCreateModels?: boolean;
  enableFillEhr?: boolean;
  consultationType?: VoaConsultationType;
  allowChangeConsultationType?: boolean;
  allowCopyDocument?: boolean;
  allowScreenSharing?: boolean;
  enableTelemetry?: boolean;
  renderElement?: HTMLElement;
};

export type VoaMountParams = {
  doctorId: string;
  patientId: string;
  consultationId: string;
  options?: VoaMountOptions;
};

export type VoaEhrFillEvent = {
  eventName: typeof VOA_PLUGIN_EVENTS.EHR_FILL;
  eventData: {
    document: string;
    template?: {
      id?: string;
      name?: string;
      slug?: string;
    };
  };
};

export type VoaStructuredOutputEvent = {
  eventName: typeof VOA_PLUGIN_EVENTS.EHR_STRUCTURED_OUTPUT;
  eventData: {
    output: Record<string, unknown>;
    from_cache?: boolean;
  };
};

export type VoaPluginMessage = VoaEhrFillEvent | VoaStructuredOutputEvent | { eventName: string };

/** Global injetado pelo script da Voa. */
export type VoaPluginGlobal = {
  instance: {
    init: (config: { token: string }) => Promise<void>;
    mount: (params: VoaMountParams) => Promise<void>;
    unmount: () => void;
  };
};

declare global {
  interface Window {
    VoaPlugin?: VoaPluginGlobal;
  }
}

export function mapAppointmentModalityToVoa(modality: string): VoaConsultationType {
  return modality === "TELE" ? "TELEMEDICINE" : "IN_PERSON";
}

export function inferRecordTypeFromVoaTemplate(slug?: string | null): string {
  if (!slug) return "ANAMNESE";
  const s = slug.toLowerCase();
  if (s.includes("soap") || s.includes("evolucao")) return "EVOLUCAO";
  if (s.includes("receita")) return "RECEITA";
  if (s.includes("atestado")) return "ATESTADO";
  return "ANAMNESE";
}
