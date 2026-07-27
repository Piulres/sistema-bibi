import { describe, expect, it } from "vitest";
import {
  REFERRAL_TEMPLATES,
  buildEncaminhamentoDocument,
  isReferralKind,
  referralKindLabel,
  referralUrgencyLabel,
} from "@/lib/clinical/encaminhamento";
import { buildClinicalGuidePdfBuffer } from "@/lib/exports/clinical-guide-pdf";
import { formatPrescriptionDocumentText } from "@/lib/prescription-document-service";

describe("Encaminhamento — templates aceleram saída do consultório", () => {
  it("expõe templates de especialidade usados no mercado (Cardiologia, Ortopedia…)", () => {
    expect(REFERRAL_TEMPLATES.length).toBeGreaterThanOrEqual(6);
    expect(REFERRAL_TEMPLATES.some((t) => t.specialty === "Cardiologia")).toBe(true);
    expect(isReferralKind("ESPECIALIDADE")).toBe(true);
    expect(referralKindLabel("SERVICO")).toMatch(/serviço/i);
    expect(referralUrgencyLabel("URGENTE")).toBe("Urgente");
  });

  it("gera texto estruturado com destino, motivo e condutas pedidas", () => {
    const doc = buildEncaminhamentoDocument({
      patientName: "João Pereira",
      specialty: "Cardiologia",
      clinicalReason: "Dor torácica atípica com fatores de risco.",
      urgency: "BREVE",
      requestedActions: "ECG e avaliação de risco.",
      providerName: "Dra. Helena Costa",
      appointmentDate: "27/07/2026",
    });

    expect(doc.title).toContain("Cardiologia");
    expect(doc.content).toContain("João Pereira");
    expect(doc.content).toContain("Dor torácica");
    expect(doc.content).toContain("ECG");
    expect(doc.content).toContain("Breve");
  });
});

describe("Guias clínicas PDF — prestador imprime e paciente baixa no painel", () => {
  it("monta PDF A4 com cabeçalho da clínica e seções tipográficas", async () => {
    const buffer = await buildClinicalGuidePdfBuffer([
      {
        clinic: {
          displayName: "Clínica Horizonte",
          tagline: "Cuidado Pay Per Use",
          platformLabel: "Sistema Bibi - ServiceOS",
        },
        patient: {
          name: "João Pereira",
          cpf: "123.456.789-00",
          birthDateLabel: "15/03/1985",
          phone: "(11) 98888-0000",
          companyName: "TechCorp",
        },
        provider: {
          name: "Dra. Helena Costa",
          councilType: "CRM",
          councilNumber: "123456",
          councilUf: "SP",
          specialty: "Clínica Geral",
        },
        page: {
          docTypeLabel: "Pedido de exames",
          title: "Solicitação de 2 exames",
          subtitle: "Levar esta guia ao laboratório",
          issuedAtLabel: "27/07/2026 10:00",
          sections: [
            {
              heading: "Exames solicitados",
              body: "1. Hemograma completo\n2. Glicemia de jejum",
            },
          ],
          footerNote: "Confirmar preparo com a unidade realizadora.",
        },
      },
    ]);

    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.subarray(0, 4).toString("utf8")).toBe("%PDF");
  });

  it("receita de controle especial gera segunda via no mesmo PDF", async () => {
    const buffer = await buildClinicalGuidePdfBuffer([
      {
        clinic: {
          displayName: "Clínica Horizonte",
          tagline: null,
          platformLabel: "ServiceOS",
        },
        patient: {
          name: "Maria Souza",
          cpf: "987.654.321-00",
          birthDateLabel: "01/01/1990",
          phone: null,
          companyName: null,
        },
        provider: {
          name: "Dr. Ricardo Alves",
          councilType: "CRM",
          councilNumber: "654321",
          councilUf: "RJ",
          specialty: null,
        },
        page: {
          docTypeLabel: "Receita de controle especial",
          title: "Receita de controle especial",
          issuedAtLabel: "27/07/2026 11:00",
          sections: [{ heading: "Prescrição", body: "1. Clonazepam 0,5mg" }],
          footerNote: "1ª via farmácia · 2ª via paciente",
          duplicateViaLabel: "2ª VIA — Orientação ao paciente",
        },
      },
    ]);

    // Duas páginas → arquivo maior que uma guia simples
    expect(buffer.length).toBeGreaterThan(800);
    expect(buffer.subarray(0, 4).toString("utf8")).toBe("%PDF");
  });
});

describe("Receita multi-item — texto de impressão permanece legível", () => {
  it("formata itens e observações para a guia / PEP", () => {
    const text = formatPrescriptionDocumentText({
      id: "doc1",
      prescriptionKind: "COMUM",
      prescriptionKindLabel: "Receita comum",
      title: "Preparo intestinal",
      notes: "Jejum 8h",
      status: "ATIVA",
      createdAt: new Date().toISOString(),
      createdAtLabel: "27/07/2026",
      appointmentId: "apt1",
      providerName: "Dra. Helena Costa",
      itemCount: 1,
      items: [
        {
          id: "i1",
          sortOrder: 0,
          medication: "Polietilenoglicol",
          dosage: "1 sachê",
          frequency: "véspera e manhã",
          route: "VO",
          durationDays: 2,
          quantity: "4 sachês",
          notes: null,
        },
      ],
    });

    expect(text).toContain("Preparo intestinal");
    expect(text).toContain("Polietilenoglicol");
    expect(text).toContain("Jejum 8h");
  });
});
