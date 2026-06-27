"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import AppointmentCard from "@/components/ui/AppointmentCard";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import StatCard from "@/components/ui/StatCard";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import { useAsyncData } from "@/hooks/useAsyncData";
import { fetchJson } from "@/lib/ui/api-feedback";
import { cn } from "@/lib/utils/cn";

type Appt = {
  id: string;
  scheduledAt: string;
  status: string;
  modality: string;
  reason: string | null;
  patient: { id: string; name: string; company: string | null };
  proceduresCount: number;
};

type Summary = { today: number; upcoming: number; past: number };

type View = "day" | "upcoming" | "past";

type AgendaPayload = {
  appointments?: Appt[];
  summary?: Summary;
};

const TABS: { id: View; label: string; description: string }[] = [
  { id: "day", label: "Dia", description: "Agenda por data" },
  { id: "upcoming", label: "Próximos", description: "Consultas futuras" },
  { id: "past", label: "Histórico", description: "Atendimentos anteriores" },
];

function formatDateLabel(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function AgendaView() {
  const [view, setView] = useState<View>("day");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const loadAgenda = useCallback(() => {
    const params = new URLSearchParams({ view });
    if (view === "day") params.set("date", date);
    return fetchJson<AgendaPayload>(
      `/api/prestador/agenda?${params}`,
      undefined,
      "Falha ao carregar a agenda",
    );
  }, [view, date]);

  const { data, loading, error, reload } = useAsyncData(loadAgenda, [view, date]);

  const appts = data?.appointments ?? [];
  const summary = data?.summary ?? null;

  const isToday = date === new Date().toISOString().slice(0, 10);

  const headerTitle =
    view === "day"
      ? isToday
        ? "Agenda de hoje"
        : `Agenda — ${formatDateLabel(date)}`
      : view === "upcoming"
        ? "Próximas consultas"
        : "Histórico de atendimentos";

  const headerDescription =
    view === "day"
      ? `${appts.length} atendimento(s) neste dia`
      : view === "upcoming"
        ? `${summary?.upcoming ?? 0} consulta(s) agendada(s) a partir de hoje`
        : `${summary?.past ?? 0} atendimento(s) anteriores`;

  return (
    <ViewStateBoundary
      loading={loading}
      error={error}
      loadingMessage="Carregando agenda..."
      onRetry={() => void reload()}
    >
      <div className="space-y-4">
        {summary && (
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Hoje"
              value={summary.today}
              info="Atendimentos agendados para a data de hoje."
            />
            <StatCard
              label="Próximos"
              value={summary.upcoming}
              tone="accent"
              info="Consultas futuras a partir de hoje."
            />
            <StatCard
              label="Histórico"
              value={summary.past}
              info="Atendimentos já realizados ou anteriores a hoje."
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                view === tab.id
                  ? "bg-[var(--portal-accent)] text-white"
                  : "bg-[var(--surface-muted)] text-[var(--text-muted)] hover:bg-[var(--surface-card)]",
              )}
            >
              {tab.label}
              {summary && (
                <span className="ml-1.5 tabular-nums opacity-80">
                  ({tab.id === "day" ? summary.today : tab.id === "upcoming" ? summary.upcoming : summary.past})
                </span>
              )}
            </button>
          ))}
        </div>

        {view === "day" && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDate(shiftDate(date, -1))}>
              ← Anterior
            </Button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-1.5 text-sm"
            />
            <Button variant="secondary" size="sm" onClick={() => setDate(shiftDate(date, 1))}>
              Próximo →
            </Button>
            {!isToday && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDate(new Date().toISOString().slice(0, 10))}
              >
                Hoje
              </Button>
            )}
          </div>
        )}

        <SectionHeader title={headerTitle} description={headerDescription} />

        {appts.length === 0 ? (
          <EmptyState
            title={
              view === "upcoming"
                ? "Nenhuma consulta futura"
                : view === "past"
                  ? "Nenhum atendimento anterior"
                  : "Sem consultas neste dia"
            }
            message={
              view === "upcoming"
                ? "Novos agendamentos aparecem aqui quando a recepção confirma a agenda."
                : view === "past"
                  ? "O histórico mostra atendimentos de dias anteriores com este prestador."
                  : "Nenhum atendimento agendado para esta data."
            }
            hint={view !== "past" ? "Use as abas Próximos ou Histórico para ver outras datas." : undefined}
          />
        ) : (
          <ul className="space-y-3">
            {appts.map((a) => {
              const scheduled = new Date(a.scheduledAt);
              const showDate = view !== "day";
              return (
                <li key={a.id}>
                  <AppointmentCard
                    time={scheduled.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    title={a.patient.name}
                    subtitle={
                      showDate
                        ? `${scheduled.toLocaleDateString("pt-BR")} · ${a.reason ?? "Consulta"}`
                        : (a.reason ?? "Consulta")
                    }
                    status={a.status}
                    particular={!a.patient.company}
                    actions={
                      <div className="flex flex-col items-end gap-1">
                        <Link
                          href={`/prestador/atendimento/${a.id}`}
                          className="text-xs font-medium text-[var(--portal-accent)] hover:underline"
                        >
                          Abrir atendimento
                        </Link>
                        <Link
                          href={`/prestador/paciente/${a.patient.id}`}
                          className="text-xs text-[var(--text-muted)] hover:underline"
                        >
                          Histórico
                        </Link>
                      </div>
                    }
                    meta={
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                        {a.proceduresCount > 0 && (
                          <span>{a.proceduresCount} procedimento(s)</span>
                        )}
                        {a.modality === "TELE" && (
                          <span className="rounded bg-[var(--status-info-bg)] px-1.5 py-0.5 text-[var(--status-info-text)]">
                            Telemedicina
                          </span>
                        )}
                      </div>
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}

        {view === "past" && (summary?.past ?? 0) > appts.length && (
          <p className="text-center text-xs text-[var(--text-muted)]">
            Exibindo os {appts.length} atendimentos mais recentes de {summary?.past} no total.
          </p>
        )}
      </div>
    </ViewStateBoundary>
  );
}
