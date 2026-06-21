/** URL mock de sala de telemedicina (Tier 4 POC). */
export function buildTelemedicineUrl(appointmentId: string): string {
  const base = process.env.TELEMEDICINE_BASE_URL ?? "https://meet.bibi.health";
  return `${base}/room/${appointmentId}`;
}

export const APPOINTMENT_MODALITIES = ["PRESENCIAL", "TELE"] as const;

export type AppointmentModality = (typeof APPOINTMENT_MODALITIES)[number];

export function isAppointmentModality(value: string): value is AppointmentModality {
  return (APPOINTMENT_MODALITIES as readonly string[]).includes(value);
}

export function modalityLabel(modality: string): string {
  return modality === "TELE" ? "Telemedicina" : "Presencial";
}
