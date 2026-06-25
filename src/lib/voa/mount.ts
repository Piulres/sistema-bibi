import "server-only";
import {
  mapAppointmentModalityToVoa,
  type VoaMountOptions,
  type VoaMountParams,
} from "@/lib/voa/constants";

export type BuildVoaMountInput = {
  appointmentId: string;
  patientId: string;
  providerId: string;
  modality: string;
  patientConsentAt: Date | null;
};

export type VoaSessionView = {
  enabled: boolean;
  configured: boolean;
  consentWarning: string | null;
  pluginScriptUrl: string;
  token: string | null;
  mount: VoaMountParams;
};

export function buildVoaMountParams(input: BuildVoaMountInput): VoaMountParams {
  const consultationType = mapAppointmentModalityToVoa(input.modality);
  const options: VoaMountOptions = {
    enableFillEhr: true,
    consultationType,
    allowChangeConsultationType: true,
    allowScreenSharing: consultationType === "TELEMEDICINE",
    allowCopyDocument: true,
    darkMode: false,
    enableTelemetry: true,
  };

  return {
    doctorId: input.providerId,
    patientId: input.patientId,
    consultationId: input.appointmentId,
    options,
  };
}

export function buildConsentWarning(consentAt: Date | null): string | null {
  if (consentAt) return null;
  return "Este paciente não possui consentimento LGPD registrado. Confirme autorização antes de gravar a consulta.";
}
