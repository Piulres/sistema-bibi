"use client";

import Link from "next/link";
import { useCallback } from "react";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import CalloutCard from "@/components/ui/CalloutCard";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import { useAsyncData } from "@/hooks/useAsyncData";
import { fetchJson } from "@/lib/ui/api-feedback";

type Dashboard = {
  generatedAtLabel: string;
  kpis: {
    appointmentsToday: number;
    confirmedToday: number;
    completedToday: number;
    pendingToday: number;
    teleToday: number;
    proceduresWeek: number;
    revenueWeekLabel: string;
    uniquePatients: number;
  };
  nextAppointment: {
    id: string;
    patientName: string;
    scheduledAtLabel: string;
    status: string;
    modality: string;
  } | null;
  todayQueue: {
    id: string;
    patientName: string;
    scheduledAtLabel: string;
    status: string;
    modality: string;
  }[];
};

type DashboardPayload = {
  dashboard?: Dashboard;
};

export default function PrestadorDashboardView() {
  const loadDashboard = useCallback(
    () =>
      fetchJson<DashboardPayload>(
        "/api/prestador/dashboard",
        undefined,
        "Erro ao carregar indicadores",
      ),
    [],
  );

  const { data, loading, error, reload } = useAsyncData(loadDashboard, []);

  const dashboard = data?.dashboard ?? null;

  return (
    <ViewStateBoundary
      loading={loading}
      error={error}
      loadingMessage="Carregando indicadores..."
      onRetry={() => void reload()}
    >
      {dashboard && (() => {
        const { kpis, nextAppointment, todayQueue } = dashboard;
        return (
    <div className="space-y-8">
      <p className="text-xs text-[var(--text-muted)]">Atualizado em {dashboard.generatedAtLabel}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Atendimentos hoje"
          value={kpis.appointmentsToday}
          hint={`${kpis.completedToday} realizados · ${kpis.confirmedToday} confirmados`}
          info="Consultas agendadas para hoje, exceto canceladas."
        />
        <StatCard
          label="Pendentes hoje"
          value={kpis.pendingToday}
          tone="warning"
          info="Agendados ou confirmados que ainda não foram marcados como realizados."
        />
        <StatCard
          label="Procedimentos (semana)"
          value={kpis.proceduresWeek}
          tone="accent"
          hint={kpis.revenueWeekLabel}
          info="Procedimentos Pay Per Use registrados por você nesta semana."
        />
        <StatCard
          label="Pacientes atendidos"
          value={kpis.uniquePatients}
          hint={kpis.teleToday > 0 ? `${kpis.teleToday} tele hoje` : undefined}
          info="Total de pacientes distintos com consultas na sua agenda."
        />
      </div>

      {nextAppointment ? (
        <CalloutCard
          data-tour-id="prestador-next-appt"
          title="Próximo atendimento"
          description={`${nextAppointment.patientName} · ${nextAppointment.scheduledAtLabel}`}
        >
          <Link href={`/prestador/atendimento/${nextAppointment.id}`}>
            <Button variant="portal" size="sm">
              Abrir atendimento
            </Button>
          </Link>
        </CalloutCard>
      ) : (
        <CalloutCard
          title="Sem atendimentos pendentes hoje"
          description="Confira a agenda completa ou consulte os próximos agendamentos."
        >
          <Link href="/prestador">
            <Button variant="secondary" size="sm">
              Ver agenda
            </Button>
          </Link>
        </CalloutCard>
      )}

      <section>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Fila do dia</h2>
        {todayQueue.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">Nenhum atendimento para hoje.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {todayQueue.map((item) => (
              <Card key={item.id} padding="sm" className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--text-primary)]">{item.patientName}</p>
                  <p className="text-sm text-[var(--text-muted)]">{item.scheduledAtLabel}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={item.status} map="appointment" />
                  {item.modality === "TELE" && (
                    <span className="text-xs text-[var(--portal-accent)]">Telemedicina</span>
                  )}
                  <Link
                    href={`/prestador/atendimento/${item.id}`}
                    className="text-sm font-medium text-[var(--portal-accent)] hover:underline"
                  >
                    Atender
                  </Link>
                </div>
              </Card>
            ))}
          </ul>
        )}
      </section>
    </div>
        );
      })()}
    </ViewStateBoundary>
  );
}
