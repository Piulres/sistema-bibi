import { describe, expect, it } from "vitest";
import {
  buildAtestadoDocument,
  validateAtestadoForm,
  atestadoKindLabel,
  ATESTADO_KINDS,
} from "@/lib/clinical/atestado";
import {
  buildReceitaPepTemplate,
  prescriptionKindLabel,
  prescriptionKindHint,
  isPrescriptionKind,
  PRESCRIPTION_KINDS,
} from "@/lib/clinical/receita";
import { buildPepTemplate } from "@/lib/pep-templates";

describe("atestado CFM", () => {
  it("expõe tipos canônicos", () => {
    expect(ATESTADO_KINDS).toEqual([
      "AFASTAMENTO",
      "ACOMPANHAMENTO",
      "COMPARECIMENTO",
    ]);
    expect(atestadoKindLabel("AFASTAMENTO")).toBe("Atestado de afastamento");
  });

  it("bloqueia CID sem autorização do paciente", () => {
    expect(
      validateAtestadoForm({
        kind: "AFASTAMENTO",
        patientName: "João",
        days: 3,
        startDateLabel: "26/07/2026",
        cid: "J06.9",
        cidAuthorizedByPatient: false,
      }),
    ).toMatch(/autorização/i);
  });

  it("gera documento com CID autorizado e aviso Atesta CFM", () => {
    const doc = buildAtestadoDocument({
      kind: "AFASTAMENTO",
      patientName: "João Pereira",
      patientCpf: "123.456.789-00",
      days: 2,
      startDateLabel: "26/07/2026",
      cid: "J06.9",
      cidAuthorizedByPatient: true,
      providerName: "Dra. Helena",
    });
    expect(doc.title).toBe("Atestado de afastamento");
    expect(doc.content).toContain("João Pereira");
    expect(doc.content).toContain("2 dia(s)");
    expect(doc.content).toContain("J06.9");
    expect(doc.content).toContain("Atesta CFM");
  });
});

describe("receita comum e controle especial", () => {
  it("distingue tipos Portaria 344", () => {
    expect(PRESCRIPTION_KINDS).toEqual(["COMUM", "CONTROLE_ESPECIAL"]);
    expect(isPrescriptionKind("COMUM")).toBe(true);
    expect(isPrescriptionKind("ESPECIAL")).toBe(false);
    expect(prescriptionKindLabel("CONTROLE_ESPECIAL")).toMatch(/controle especial/i);
    expect(prescriptionKindHint("CONTROLE_ESPECIAL")).toMatch(/duas vias/i);
  });

  it("template de controle especial cita vias da farmácia", () => {
    const tpl = buildReceitaPepTemplate({
      patientName: "Maria",
      kind: "CONTROLE_ESPECIAL",
      appointmentDate: "26/07/2026",
    });
    expect(tpl.content).toContain("1ª via");
    expect(tpl.content).toContain("2ª via");
    expect(tpl.content).toContain("Maria");
  });

  it("buildPepTemplate encaminha tipo de receita", () => {
    const comum = buildPepTemplate("RECEITA", {
      patientName: "Ana",
      prescriptionKind: "COMUM",
    });
    expect(comum.title).toBe("Receita comum");
    expect(comum.content).toContain("RECEITA COMUM");

    const especial = buildPepTemplate("RECEITA", {
      patientName: "Ana",
      prescriptionKind: "CONTROLE_ESPECIAL",
    });
    expect(especial.title).toBe("Receita de controle especial");
  });
});
