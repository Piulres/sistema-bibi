"use client";

import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";
import ExportButtons from "@/components/ExportButtons";
import { REPORT_EXPORT_FORMATS } from "@/lib/exports/format";

export default function ReportsView() {
  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader
          title="Exportar relatórios"
          description="Downloads em PDF, CSV, JSON ou TXT para análise externa ou integração contábil."
        />
        <div className="mt-6 space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
              Faturamento e Pay Per Use
            </p>
            <ExportButtons
              baseUrl="/api/interno/reports"
              query={{ type: "billing" }}
              formats={REPORT_EXPORT_FORMATS}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">Pipeline CRM</p>
            <ExportButtons
              baseUrl="/api/interno/reports"
              query={{ type: "crm" }}
              formats={REPORT_EXPORT_FORMATS}
            />
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Conteúdo dos relatórios" />
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
          <li>
            <strong>Faturamento:</strong> faturas emitidas (status, valor, beneficiário) + procedimentos
            Pay Per Use ainda não faturados.
          </li>
          <li>
            <strong>CRM:</strong> empresas por status, CNPJ, beneficiários vinculados e volume de faturas.
          </li>
          <li>
            <strong>Formatos:</strong> PDF (documento), CSV (planilha), JSON (integração) e TXT (texto legível).
          </li>
        </ul>
      </Card>
    </div>
  );
}
