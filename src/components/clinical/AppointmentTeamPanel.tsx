"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import SectionHeader from "@/components/ui/SectionHeader";
import { useLabels } from "@/hooks/useLabels";
import { teamRoleLabel, teamRolesForNiche, type TeamRole } from "@/lib/clinical/team-roles";
import type { NicheId } from "@/lib/niche/types";

const fieldClass =
  "w-full min-w-0 rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2.5 text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]";

type Participant = {
  id: string;
  role: string;
  roleLabel: string;
  userId: string;
  userName: string;
  userSpecialty: string | null;
  notes: string | null;
  feeLabel: string | null;
};

type EligibleMember = {
  id: string;
  name: string;
  email: string;
  specialty: string | null;
};

type TeamRequirement = {
  role: string;
  required: boolean;
  minCount?: number;
};

type Props = {
  appointmentId: string;
  niche?: NicheId;
  participants: Participant[];
  scheduledProcedure?: {
    name: string;
    teamRequirements: TeamRequirement[];
  } | null;
  canEdit: boolean;
  onChanged?: () => void;
};

export default function AppointmentTeamPanel({
  appointmentId,
  niche = "MEDICAL",
  participants,
  scheduledProcedure,
  canEdit,
  onChanged,
}: Props) {
  const { niche: contextNiche } = useLabels();
  const activeNiche = niche ?? contextNiche ?? "MEDICAL";
  const availableRoles = teamRolesForNiche(activeNiche);

  const [role, setRole] = useState<TeamRole>(availableRoles[0] ?? "OUTRO");
  const [userId, setUserId] = useState("");
  const [notes, setNotes] = useState("");
  const [chargeFee, setChargeFee] = useState(true);
  const [members, setMembers] = useState<EligibleMember[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const loadEligible = useCallback(async () => {
    const res = await fetch(
      `/api/prestador/appointments/${appointmentId}/participants/eligible?role=${role}`,
    );
    const data = await res.json();
    if (res.ok) {
      setMembers(data.members ?? []);
      setUserId("");
    }
  }, [appointmentId, role]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!canEdit) return;
      await loadEligible();
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [canEdit, loadEligible]);

  async function addParticipant() {
    if (!userId) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/prestador/appointments/${appointmentId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role, notes, chargeFee }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao adicionar");
        return;
      }
      setMsg(`${teamRoleLabel(role, activeNiche)} adicionado à equipe.`);
      setNotes("");
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  async function removeParticipant(participantId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/prestador/appointments/${appointmentId}/participants?participantId=${participantId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao remover");
        return;
      }
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  const missingRequirements = (scheduledProcedure?.teamRequirements ?? []).filter((req) => {
    if (!req.required) return false;
    const count = participants.filter((p) => p.role === req.role).length;
    return count < (req.minCount ?? 1);
  });

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Equipe do atendimento"
        description="Profissionais auxiliares vinculados a este atendimento. Cobranças de equipe entram no Pay Per Use."
      />

      {scheduledProcedure && scheduledProcedure.teamRequirements.length > 0 && (
        <Alert tone="info">
          <p className="font-medium">{scheduledProcedure.name}</p>
          <p className="mt-1 text-sm">
            Requisitos:{" "}
            {scheduledProcedure.teamRequirements
              .map((r) => `${teamRoleLabel(r.role, activeNiche)}${r.required ? " (obrig.)" : ""}`)
              .join(" · ")}
          </p>
        </Alert>
      )}

      {missingRequirements.length > 0 && (
        <Alert tone="warning">
          Pendente:{" "}
          {missingRequirements
            .map((r) => teamRoleLabel(r.role, activeNiche))
            .join(", ")}
        </Alert>
      )}

      {error && <Alert tone="danger">{error}</Alert>}
      {msg && <Alert tone="success">{msg}</Alert>}

      <ul className="divide-y divide-[var(--border-default)] rounded-md border border-[var(--border-muted)]">
        {participants.length === 0 && (
          <li className="p-4 text-sm text-[var(--text-muted)]">
            Nenhum profissional auxiliar vinculado.
          </li>
        )}
        {participants.map((p) => (
          <li key={p.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-[var(--text-secondary)]">
                {p.userName}{" "}
                <span className="text-xs font-normal text-[var(--text-muted)]">({p.roleLabel})</span>
              </p>
              {p.userSpecialty && (
                <p className="text-xs text-[var(--text-muted)]">{p.userSpecialty}</p>
              )}
              {p.feeLabel && (
                <p className="text-xs text-[var(--text-muted)]">Cobrança: {p.feeLabel}</p>
              )}
              {p.notes && <p className="text-xs text-[var(--text-muted)]">{p.notes}</p>}
            </div>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void removeParticipant(p.id)}
                disabled={busy}
              >
                Remover
              </Button>
            )}
          </li>
        ))}
      </ul>

      {canEdit && (
        <div className="space-y-3 rounded-md border border-[var(--border-muted)] p-4">
          <p className="text-sm font-medium text-[var(--text-secondary)]">Adicionar à equipe</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as TeamRole)}
              className={fieldClass}
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {teamRoleLabel(r, activeNiche)}
                </option>
              ))}
            </select>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className={fieldClass}
            >
              <option value="">Selecione o profissional...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {m.specialty ? ` — ${m.specialty}` : ""}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações (opcional)"
            className={fieldClass}
          />
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={chargeFee}
              onChange={(e) => setChargeFee(e.target.checked)}
              className="rounded border-[var(--border-muted)]"
            />
            Incluir cobrança de honorários/taxa no atendimento
          </label>
          <Button onClick={() => void addParticipant()} disabled={busy || !userId}>
            Adicionar profissional
          </Button>
        </div>
      )}
    </div>
  );
}
