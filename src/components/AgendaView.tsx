"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import AppointmentCard from "@/components/ui/AppointmentCard";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import StatCard from "@/components/ui/StatCard";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import AddToCalendarMenu from "@/components/calendar/AddToCalendarMenu";
import CalendarFeedPanel from "@/components/calendar/CalendarFeedPanel";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useLabels } from "@/hooks/useLabels";
import { fetchJson } from "@/lib/ui/api-feedback";
import { cn } from "@/lib/utils/cn";
import {
  civilDateISO,
  formatDateBR,
  formatTimeBR,
  parseAppDateTime,
  shiftCivilDate,
} from "@/lib/timezone";

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

function formatDateLabel(iso: string): string {
  return formatDateBR(parseAppDateTime(iso, "12:00"), {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function AgendaView() {
  const { labels } = useLabels();
  const appt = labels.appointment;
  const apptsLabel = labels.appointments;
  const [view, setView] = useState<View>("day");
  const [date, setDate] = useState(() => civilDateISO());

  const tabs = useMemo(
    () =>
      [
        { id: "day" as const, label: "Dia", description: "Agenda por data" },
        {
          id: "upcoming" as const,
          label: "Próximos",
          description: `${apptsLabel} futuros`,
        },
        {
          id: "past" as const,
          label: "Histórico",
          description: "Atendimentos anteriores",
        },
      ] as const,
    [apptsLabel],
  );

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

  const isToday = date === civilDateISO();

  const headerTitle =
    view === "day"
      ? isToday
        ? "Agenda de hoje"
        : `Agenda — ${formatDateLabel(date)}`
      : view === "upcoming"
        ? `${apptsLabel} futuros`
        : "Histórico de atendimentos";

  const headerDescription =
    view === "day"
      ? `${appts.length} atendimento(s) neste dia`
      : view === "upcoming"
        ? `${summary?.upcoming ?? 0} ${appt.toLowerCase()}(s) agendado(s) a partir de hoje`
        : `${summary?.past ?? 0} atendimento(s) anteriores`;

  return (
    <ViewStateBoundary
      loading={loading}
      error={error}
      loadingMessage="Carregando agenda..."
      onRetry={() => void reload()}
    >
      <div className="space-y-4">
        <CalendarFeedPanel
          apiPath="/api/prestador/calendar"
          connectionsApiPath="/api/prestador/calendar/connections"
          title="Levar agenda para Google, Outlook ou Apple"
          description="Conecte Google ou Microsoft para push automático. Use o feed ICS para Apple. Em cada card, o botão Calendário adiciona um atendimento avulso."
        />

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
              info={`${apptsLabel} futuros a partir de hoje.`}
            />
            <StatCard
              label="Histórico"
              value={summary.past}
              info="Atendimentos já realizados ou anteriores a hoje."
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
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
            <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-2 sm:w-auto sm:flex">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDate(shiftCivilDate(date, -1))}
                aria-label="Dia anterior"
              >
                <span className="sm:hidden">←</span>
                <span className="hidden sm:inline">← Anterior</span>
              </Button>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="ds-touch-select min-w-0 w-full"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDate(shiftCivilDate(date, 1))}
                aria-label="Próximo dia"
              >
                <span className="sm:hidden">→</span>
                <span className="hidden sm:inline">Próximo →</span>
              </Button>
            </div>
            {!isToday && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDate(civilDateISO())}
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
                ? `Nenhum(a) ${appt.toLowerCase()} futuro(a)`
                : view === "past"
                  ? "Nenhum atendimento anterior"
                  : `Sem ${apptsLabel.toLowerCase()} neste dia`
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
                    time={formatTimeBR(scheduled)}
                    title={a.patient.name}
                    subtitle={
                      showDate
                        ? `${formatDateBR(scheduled)} · ${a.reason ?? appt}`
                        : (a.reason ?? appt)
                    }
                    status={a.status}
                    particular={!a.patient.company}
                    actions={
                      <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                        {a.status !== "CANCELADO" && a.status !== "FALTOU" ? (
                          <AddToCalendarMenu
                            apiPath={`/api/prestador/appointments/${a.id}/calendar`}
                            icsPath={`/api/prestador/appointments/${a.id}/calendar?format=ics`}
                          />
                        ) : null}
                        <Link
                          href={`/prestador/atendimento/${a.id}`}
                          className="ds-touch-link ds-touch-link-solid"
                        >
                          Abrir atendimento
                        </Link>
                        <Link
                          href={`/prestador/paciente/${a.patient.id}`}
                          className="ds-touch-link"
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
