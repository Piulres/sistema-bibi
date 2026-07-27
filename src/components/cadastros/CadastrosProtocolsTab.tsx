"use client";

import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";
import ProtocolTemplatesPanel from "@/components/ProtocolTemplatesPanel";
import ExamProtocolTemplatesPanel from "@/components/ExamProtocolTemplatesPanel";

export default function CadastrosProtocolsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader
          title="Protocolos de cuidado"
          description="Checklists editáveis (HAS, DM2, etc.) — ativar/desativar e revisar no atendimento."
        />
        <div className="mt-4">
          <ProtocolTemplatesPanel />
        </div>
      </Card>
      <Card>
        <SectionHeader
          title="Protocolos de exames"
          description="Painéis de exames reutilizáveis (pré-op, check-up…). Aplicáveis em lote na aba Exames do prestador."
        />
        <div className="mt-4">
          <ExamProtocolTemplatesPanel />
        </div>
      </Card>
    </div>
  );
}
