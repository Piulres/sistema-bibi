"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
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
      <div className="flex items-baseline justify-between">
        <SectionHeader
          title="Agenda de hoje"
          description={`${appts.length} atendimento(s) programado(s)`}
        />
      </div>

      {appts.length === 0 && (
        <EmptyState message="Nenhum atendimento agendado para hoje." />
      )}

      <ul className="space-y-3">
        {appts.map((a) => (
          <li key={a.id}>
            <Link href={`/prestador/atendimento/${a.id}`} className="block">
              <Card className="flex items-center justify-between gap-4 transition hover:border-[var(--brand-primary)] hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                      {new Date(a.scheduledAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{a.patient.name}</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {a.reason ?? "Consulta"}
                      {a.patient.company ? ` · ${a.patient.company}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge value={a.status} map="appointment" />
                  {a.proceduresCount > 0 && (
                    <span className="text-xs text-[var(--text-muted)]">
                      {a.proceduresCount} procedimento(s)
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
