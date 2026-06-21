"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import SectionHeader from "@/components/ui/SectionHeader";

export default function ReportsView() {
  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader
          title="Exportar relatórios"
          description="Downloads em CSV para análise externa ou integração contábil."
        />
        <div className="mt-6 flex flex-wrap gap-4">
          <a href="/api/interno/reports?type=billing" download>
            <Button variant="portal">Faturamento e Pay Per Use (CSV)</Button>
          </a>
          <a href="/api/interno/reports?type=crm" download>
            <Button variant="secondary">Pipeline CRM (CSV)</Button>
          </a>
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
        </ul>
      </Card>
    </div>
  );
}
