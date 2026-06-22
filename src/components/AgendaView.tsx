"use client";

import { useEffect, useState } from "react";
import AppointmentCard from "@/components/ui/AppointmentCard";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import Alert from "@/components/ui/Alert";

type Appt = {
  id: string;
  scheduledAt: string;
  status: string;
  reason: string | null;
  patient: { id: string; name: string; company: string | null };
  proceduresCount: number;
};

export default function AgendaView() {
  const [appts, setAppts] = useState<Appt[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/prestador/agenda")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setAppts(d.appointments);
      })
      .catch(() => setError("Falha ao carregar a agenda"));
  }, []);

  if (error) return <Alert tone="danger">{error}</Alert>;
  if (!appts) return <LoadingState message="Carregando agenda..." />;

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Agenda de hoje"
        description={`${appts.length} atendimento(s) programado(s)`}
      />

      {appts.length === 0 && (
        <EmptyState
          title="Sem consultas hoje"
          message="Nenhum atendimento agendado para hoje."
          hint="Novos agendamentos aparecem aqui quando a recepção confirma a agenda."
        />
      )}

      <ul className="space-y-3">
        {appts.map((a) => (
          <li key={a.id}>
            <AppointmentCard
              href={`/prestador/atendimento/${a.id}`}
              time={new Date(a.scheduledAt).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              title={a.patient.name}
              subtitle={a.reason ?? "Consulta"}
              status={a.status}
              particular={!a.patient.company}
              meta={
                a.proceduresCount > 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">
                    {a.proceduresCount} procedimento(s) registrado(s)
                  </p>
                ) : (
                  <p className="text-xs text-[var(--portal-accent)]">Abrir atendimento →</p>
                )
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
