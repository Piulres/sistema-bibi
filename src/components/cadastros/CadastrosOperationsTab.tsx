"use client";

import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";
import CrudOperationsMap from "@/components/CrudOperationsMap";
import FlowImprovementsMap from "@/components/FlowImprovementsMap";

export default function CadastrosOperationsTab() {
  return (
    <div className="space-y-6" data-tour-id="cadastros-crud-map">
      <Card>
        <SectionHeader
          title="Mapa de operações CRUD"
          description="Onde cada entidade do sistema pode ser criada, consultada, alterada ou removida na interface."
        />
        <div className="mt-4">
          <CrudOperationsMap />
        </div>
      </Card>
      <Card>
        <SectionHeader
          title="Mapa de melhorias de fluxo"
          description="Passos de jornada implementados e backlog priorizado por portal."
        />
        <div className="mt-4">
          <FlowImprovementsMap />
        </div>
      </Card>
    </div>
  );
}
