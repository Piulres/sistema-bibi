import { describe, expect, it } from "vitest";
import { formatPrescriptionDocumentText } from "@/lib/prescription-document-service";

describe("prescription-document-service", () => {
  it("formata receita multi-item para texto", () => {
    const text = formatPrescriptionDocumentText({
      id: "doc1",
      prescriptionKind: "COMUM",
      prescriptionKindLabel: "Receita comum",
      title: "Pré-colonoscopia",
      notes: "Jejum absoluto",
      status: "ATIVA",
      createdAt: new Date().toISOString(),
      createdAtLabel: "27/07/2026",
      appointmentId: "apt1",
      providerName: "Dr. Teste",
      itemCount: 2,
      items: [
        {
          id: "i1",
          sortOrder: 0,
          medication: "Polietilenoglicol",
          dosage: "1 sachê",
          frequency: "Diluir conforme bula",
          route: "oral",
          durationDays: 1,
          quantity: "4 sachês",
          notes: null,
        },
        {
          id: "i2",
          sortOrder: 1,
          medication: "Buscopan",
          dosage: "10mg",
          frequency: "8/8h",
          route: null,
          durationDays: 2,
          quantity: null,
          notes: null,
        },
      ],
    });

    expect(text).toContain("Pré-colonoscopia");
    expect(text).toContain("Polietilenoglicol");
    expect(text).toContain("Buscopan");
    expect(text).toContain("Jejum absoluto");
  });
});
