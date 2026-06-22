"use client";

import StatusBadge from "@/components/ui/StatusBadge";
import Card from "@/components/ui/Card";

export type ClinicalSidebarData = {
  profile: {
    allergies: { substance: string; severity?: string }[];
    chronicConditions: { condition: string }[];
    bloodType: string | null;
  };
  activeMedications: { id: string; medication: string; dosage: string; frequency: string }[];
  pendingExams: { id: string; examName: string; status: string; statusLabel: string }[];
  activeProtocols: { id: string; templateName: string; progressPercent: number }[];
};

type Props = {
  data: ClinicalSidebarData | null;
  loading?: boolean;
};

export default function ClinicalSidebar({ data, loading }: Props) {
  if (loading) {
    return (
      <Card padding="md" className="h-fit">
        <p className="text-sm text-[var(--text-muted)]">Carregando perfil clínico...</p>
      </Card>
    );
  }

  if (!data) return null;

  const hasAlerts = data.profile.allergies.length > 0;

  return (
    <Card padding="md" className="h-fit space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Resumo clínico
      </h2>

      {hasAlerts && (
        <div className="rounded-[var(--radius-button)] border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Alergias</p>
          <ul className="mt-1 space-y-0.5">
            {data.profile.allergies.map((a) => (
              <li key={a.substance} className="text-sm text-amber-900 dark:text-amber-100">
                {a.substance}
                {a.severity ? ` (${a.severity})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.profile.bloodType && (
        <p className="text-sm text-[var(--text-secondary)]">
          <span className="font-medium">Tipo sanguíneo:</span> {data.profile.bloodType}
        </p>
      )}

      {data.profile.chronicConditions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)]">Condições crônicas</p>
          <ul className="mt-1 text-sm text-[var(--text-secondary)]">
            {data.profile.chronicConditions.map((c) => (
              <li key={c.condition}>{c.condition}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-[var(--text-muted)]">Medicações ativas</p>
        {data.activeMedications.length === 0 ? (
          <p className="mt-1 text-sm text-[var(--text-muted)]">Nenhuma</p>
        ) : (
          <ul className="mt-1 space-y-2">
            {data.activeMedications.slice(0, 5).map((m) => (
              <li key={m.id} className="text-sm text-[var(--text-secondary)]">
                <span className="font-medium">{m.medication}</span>
                <br />
                <span className="text-xs text-[var(--text-muted)]">
                  {m.dosage} · {m.frequency}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-[var(--text-muted)]">Exames pendentes</p>
        {data.pendingExams.length === 0 ? (
          <p className="mt-1 text-sm text-[var(--text-muted)]">Nenhum</p>
        ) : (
          <ul className="mt-1 space-y-2">
            {data.pendingExams.slice(0, 4).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-[var(--text-secondary)]">{e.examName}</span>
                <StatusBadge value={e.status} label={e.statusLabel} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {data.activeProtocols.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)]">Protocolos ativos</p>
          <ul className="mt-1 space-y-2">
            {data.activeProtocols.map((p) => (
              <li key={p.id} className="text-sm text-[var(--text-secondary)]">
                {p.templateName}
                <div className="mt-1 h-1.5 w-full rounded-full bg-[var(--surface-muted)]">
                  <div
                    className="h-1.5 rounded-full bg-[var(--brand-primary)]"
                    style={{ width: `${p.progressPercent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
