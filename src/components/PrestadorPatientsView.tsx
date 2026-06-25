"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import LoadingState from "@/components/ui/LoadingState";
import Alert from "@/components/ui/Alert";
import { useLabels } from "@/hooks/useLabels";

type PatientRow = {
  id: string;
  name: string;
  cpf: string;
  company: string | null;
  appointmentsCount: number;
};

type PetRow = {
  id: string;
  name: string;
  speciesLabel: string;
  breed: string | null;
  sizeLabel: string | null;
  tutorName: string;
  tutorCpf: string;
  company: string | null;
  appointmentsCount: number;
};

export default function PrestadorPatientsView() {
  const { niche, labels } = useLabels();
  const isVet = niche === "VET";
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [pets, setPets] = useState<PetRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      (async () => {
        const endpoint = isVet ? "/api/prestador/pets" : "/api/prestador/patients";
        const res = await fetch(`${endpoint}?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (!active) return;
        if (!res.ok) setError(data.error ?? `Erro ao carregar ${labels.patients.toLowerCase()}`);
        else if (isVet) setPets(data.pets ?? []);
        else setPatients(data.patients ?? []);
        setLoading(false);
      })();
    }, query ? 250 : 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, isVet, labels.patients]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {isVet ? `Meus ${labels.patients.toLowerCase()}` : "Meus pacientes"}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          {isVet
            ? `Histórico clínico por ${labels.patient.toLowerCase()} — ficha, medicações e exames.`
            : "Histórico clínico longitudinal — prontuário, medicação, exames e protocolos."}
        </p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={isVet ? `Buscar ${labels.patient.toLowerCase()} ou tutor...` : "Buscar por nome ou CPF..."}
        className="w-full max-w-md rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2"
      />

      {error && <Alert tone="danger">{error}</Alert>}
      {loading ? (
        <LoadingState message={`Carregando ${labels.patients.toLowerCase()}...`} />
      ) : isVet ? (
        pets.length === 0 ? (
          <Card padding="lg">
            <p className="text-sm text-[var(--text-muted)]">
              Nenhum {labels.patient.toLowerCase()} encontrado nos seus atendimentos.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pets.map((p) => (
              <Link key={p.id} href={`/prestador/paciente/${p.id}`}>
                <Card padding="md" className="transition hover:border-[var(--portal-accent)]">
                  <p className="font-semibold text-[var(--text-primary)]">{p.name}</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {p.speciesLabel}{p.breed ? ` · ${p.breed}` : ""}
                    {p.sizeLabel ? ` · ${p.sizeLabel}` : ""}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {labels.beneficiary}: {p.tutorName}
                  </p>
                  {p.company && <p className="text-xs text-[var(--text-muted)]">{p.company}</p>}
                  <p className="mt-2 text-xs text-[var(--portal-accent)]">
                    {p.appointmentsCount} atendimento(s) · Ver histórico →
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )
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
