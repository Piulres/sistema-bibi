"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import SectionHeader from "@/components/ui/SectionHeader";
import InfoTooltip from "@/components/ui/InfoTooltip";

export default function PrestadorReportsView() {
  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader
          title="Exportar relatórios"
          description="Downloads em CSV dos seus atendimentos e procedimentos."
        />
        <div className="mt-6 flex flex-wrap gap-4">
          <a href="/api/prestador/reports?type=procedures" download>
            <Button variant="portal">Procedimentos (CSV)</Button>
          </a>
          <a href="/api/prestador/reports?type=appointments" download>
            <Button variant="secondary">Atendimentos (CSV)</Button>
          </a>
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
