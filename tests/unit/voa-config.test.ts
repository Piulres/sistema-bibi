import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getVoaConfig, assertVoaOperational } from "@/lib/voa/config";
import {
  mapAppointmentModalityToVoa,
  inferRecordTypeFromVoaTemplate,
} from "@/lib/voa/constants";
import { buildVoaMountParams, buildConsentWarning } from "@/lib/voa/mount";

describe("Voa — config", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.VOA_ENABLED;
    delete process.env.VOA_INTEGRATION_TOKEN;
    delete process.env.VOA_PLUGIN_SCRIPT_URL;
  });

  afterEach(() => {
    process.env = env;
  });

  it("desabilitado por padrão", () => {
    const config = getVoaConfig();
    expect(config.enabled).toBe(false);
    expect(config.hasToken).toBe(false);
  });

  it("habilitado com token", () => {
    process.env.VOA_ENABLED = "true";
    process.env.VOA_INTEGRATION_TOKEN = "test-token";
    const config = getVoaConfig();
    expect(config.enabled).toBe(true);
    expect(config.hasToken).toBe(true);
    expect(assertVoaOperational()).toEqual({ ok: true, token: "test-token" });
  });

  it("assertVoaOperational falha sem token", () => {
    process.env.VOA_ENABLED = "true";
    const result = assertVoaOperational();
    expect(result.ok).toBe(false);
  });
});

describe("Voa — mount helpers", () => {
  it("mapeia modalidade TELE para TELEMEDICINE", () => {
    expect(mapAppointmentModalityToVoa("TELE")).toBe("TELEMEDICINE");
    expect(mapAppointmentModalityToVoa("PRESENCIAL")).toBe("IN_PERSON");
  });

  it("buildVoaMountParams inclui enableFillEhr", () => {
    const mount = buildVoaMountParams({
      appointmentId: "appt-1",
      patientId: "pat-1",
      providerId: "doc-1",
      modality: "TELE",
      patientConsentAt: new Date(),
    });
    expect(mount.consultationId).toBe("appt-1");
    expect(mount.options?.consultationType).toBe("TELEMEDICINE");
    expect(mount.options?.enableFillEhr).toBe(true);
    expect(mount.options?.allowScreenSharing).toBe(true);
  });

  it("inferRecordTypeFromVoaTemplate", () => {
    expect(inferRecordTypeFromVoaTemplate("anamnese-padrao")).toBe("ANAMNESE");
    expect(inferRecordTypeFromVoaTemplate("soap-consulta")).toBe("EVOLUCAO");
  });

  it("buildConsentWarning quando sem consentimento", () => {
    expect(buildConsentWarning(null)).toMatch(/LGPD/);
    expect(buildConsentWarning(new Date())).toBeNull();
  });
});
