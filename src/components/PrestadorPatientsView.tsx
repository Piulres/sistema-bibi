"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import LoadingState from "@/components/ui/LoadingState";
import Alert from "@/components/ui/Alert";

type PatientRow = {
  id: string;
  name: string;
  cpf: string;
  company: string | null;
  appointmentsCount: number;
};

export default function PrestadorPatientsView() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
  const timer = setTimeout(() => {
    (async () => {
      const res = await fetch(`/api/prestador/patients?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!active) return;
      if (!res.ok) setError(data.error ?? "Erro ao carregar pacientes");
      else setPatients(data.patients);
      setLoading(false);
    })();
  }, query ? 250 : 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Meus pacientes</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Histórico clínico longitudinal — prontuário, medicação, exames e protocolos.
        </p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nome ou CPF..."
        className="w-full max-w-md rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2"
      />

      {error && <Alert tone="danger">{error}</Alert>}
      {loading ? (
        <LoadingState message="Carregando pacientes..." />
      ) : patients.length === 0 ? (
        <Card padding="lg">
          <p className="text-sm text-[var(--text-muted)]">Nenhum paciente encontrado nos seus atendimentos.</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {patients.map((p) => (
            <Link key={p.id} href={`/prestador/paciente/${p.id}`}>
              <Card padding="md" className="transition hover:border-[var(--portal-accent)]">
                <p className="font-semibold text-[var(--text-primary)]">{p.name}</p>
                <p className="text-sm text-[var(--text-muted)]">CPF {p.cpf}</p>
                {p.company && <p className="text-xs text-[var(--text-muted)]">{p.company}</p>}
                <p className="mt-2 text-xs text-[var(--portal-accent)]">
                  {p.appointmentsCount} atendimento(s) · Ver histórico clínico →
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
