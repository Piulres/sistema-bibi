import { CRUD_OPERATIONS_MAP } from "@/lib/crud-operations-map";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";

export default function CrudOperationsMap() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        Referência de onde cada operação de criação, leitura, atualização e exclusão está
        disponível na interface. Entidades sem exclusão na POC aparecem como &quot;—&quot;.
      </p>
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border-muted)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[var(--surface-muted)] text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3 font-medium">Entidade</th>
              <th className="px-4 py-3 font-medium">Criar</th>
              <th className="px-4 py-3 font-medium">Ler</th>
              <th className="px-4 py-3 font-medium">Atualizar</th>
              <th className="px-4 py-3 font-medium">Excluir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-default)]">
            {CRUD_OPERATIONS_MAP.map((row) => (
              <tr key={row.entity} className="align-top">
                <td className="px-4 py-3 font-medium">{row.entity}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{row.create}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{row.read}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{row.update}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{row.delete}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Card>
        <SectionHeader title="Legenda" />
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-[var(--text-muted)]">
          <li>
            <strong className="text-[var(--text-secondary)]">Walk-in particular</strong> — paciente
            sem empresa PJ; cadastro e agendamento na mesma tela em Agenda.
          </li>
          <li>
            <strong className="text-[var(--text-secondary)]">Check-in</strong> — na agenda,
            AGENDADO → CONFIRMADO quando o paciente chega à clínica.
          </li>
          <li>
            <strong className="text-[var(--text-secondary)]">Cliente 360°</strong> — visão
            consolidada em <code className="text-xs">/interno/beneficiarios/[id]</code>.
          </li>
        </ul>
      </Card>
    </div>
  );
}
