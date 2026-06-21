"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Appt = {
  id: string;
  scheduledAt: string;
  status: string;
  reason: string | null;
  patient: { id: string; name: string; company: string | null };
  proceduresCount: number;
};

const statusStyle: Record<string, string> = {
  AGENDADO: "bg-slate-100 text-slate-700",
  CONFIRMADO: "bg-blue-100 text-blue-700",
  REALIZADO: "bg-emerald-100 text-emerald-700",
  FALTOU: "bg-amber-100 text-amber-700",
  CANCELADO: "bg-red-100 text-red-700",
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

  if (error) return <p className="text-red-600">{error}</p>;
  if (!appts) return <p className="text-slate-500">Carregando agenda...</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Agenda de hoje</h2>
        <span className="text-sm text-slate-500">{appts.length} atendimento(s)</span>
      </div>

      {appts.length === 0 && (
        <p className="rounded-lg bg-white p-4 text-slate-500">
          Nenhum atendimento agendado para hoje.
        </p>
      )}

      <ul className="space-y-3">
        {appts.map((a) => (
          <li key={a.id}>
            <Link
              href={`/prestador/atendimento/${a.id}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-300 hover:shadow"
            >
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">
                    {new Date(a.scheduledAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">{a.patient.name}</p>
                  <p className="text-sm text-slate-500">
                    {a.reason ?? "Consulta"}
                    {a.patient.company ? ` · ${a.patient.company}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    statusStyle[a.status] ?? "bg-slate-100 text-slate-700"
                  }`}
                >
                  {a.status}
                </span>
                {a.proceduresCount > 0 && (
                  <span className="text-xs text-slate-400">
                    {a.proceduresCount} procedimento(s)
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
