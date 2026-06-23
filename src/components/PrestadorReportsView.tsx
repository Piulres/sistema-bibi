"use client";

import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";
import ExportButtons from "@/components/ExportButtons";
import InfoTooltip from "@/components/ui/InfoTooltip";

export default function PrestadorReportsView() {
  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader
          title="Exportar relatórios"
          description="Downloads em PDF, Excel ou CSV dos seus atendimentos e procedimentos."
        />
        <div className="mt-6 space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">Procedimentos</p>
            <ExportButtons
              baseUrl="/api/prestador/reports"
              query={{ type: "procedures" }}
              formats={["pdf", "xlsx", "csv"]}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">Atendimentos</p>
            <ExportButtons
              baseUrl="/api/prestador/reports"
              query={{ type: "appointments" }}
              formats={["pdf", "xlsx", "csv"]}
            />
          </div>
        </div>
      </Card>

      <Card>
        <p className="flex items-center gap-1.5 text-lg font-semibold text-[var(--text-primary)]">
          Conteúdo dos relatórios
          <InfoTooltip content="Os valores refletem procedimentos realizados, não repasse financeiro da clínica." />
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
          <li>
            <strong>Procedimentos:</strong> data, paciente, procedimento, valor, status de faturamento.
          </li>
          <li>
            <strong>Atendimentos:</strong> consultas do período com total de procedimentos e valor gerado.
          </li>
        </ul>
      </Card>
    </div>
  );
}
