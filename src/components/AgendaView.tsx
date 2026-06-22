"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppointmentCard from "@/components/ui/AppointmentCard";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
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
  const [appts, setAppts] = useState<Appt[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ view });
        if (view === "day") params.set("date", date);
        const res = await fetch(`/api/prestador/agenda?${params}`);
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          setError(data.error ?? "Falha ao carregar a agenda");
          setAppts([]);
          return;
        }
        setAppts(data.appointments);
        setSummary(data.summary);
      } catch {
        if (!active) return;
        setError("Falha ao carregar a agenda");
        setAppts([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [view, date]);

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
      ? `${appts?.length ?? 0} atendimento(s) neste dia`
      : view === "upcoming"
        ? `${summary?.upcoming ?? 0} consulta(s) agendada(s) a partir de hoje`
        : `${summary?.past ?? 0} atendimento(s) anteriores`;

  return (
    <div className="space-y-4">
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
            <Button variant="secondary" size="sm" onClick={() => setDate(new Date().toISOString().slice(0, 10))}>
              Hoje
            </Button>
          )}
        </div>
      )}

      <SectionHeader title={headerTitle} description={headerDescription} />

      {error && <Alert tone="danger">{error}</Alert>}
      {loading && <LoadingState message="Carregando agenda..." />}

      {!loading && !error && appts && appts.length === 0 && (
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
      )}

      {!loading && appts && appts.length > 0 && (
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

      {!loading && view === "past" && (summary?.past ?? 0) > (appts?.length ?? 0) && (
        <p className="text-center text-xs text-[var(--text-muted)]">
          Exibindo os {appts?.length} atendimentos mais recentes de {summary?.past} no total.
        </p>
      )}
    </div>
  );
}
