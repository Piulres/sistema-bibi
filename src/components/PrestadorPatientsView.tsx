"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import { useLabels } from "@/hooks/useLabels";
import { useAsyncData } from "@/hooks/useAsyncData";
import { fetchJson } from "@/lib/ui/api-feedback";

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

type PatientsPayload = {
  patients?: PatientRow[];
  pets?: PetRow[];
};

export default function PrestadorPatientsView() {
  const { niche, labels } = useLabels();
  const isVet = niche === "VET";
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [query]);

  const loadPatients = useCallback(() => {
    const endpoint = isVet ? "/api/prestador/pets" : "/api/prestador/patients";
    return fetchJson<PatientsPayload>(
      `${endpoint}?q=${encodeURIComponent(debouncedQuery)}`,
      undefined,
      `Erro ao carregar ${labels.patients.toLowerCase()}`,
    );
  }, [debouncedQuery, isVet, labels.patients]);

  const { data, loading, error, reload } = useAsyncData(loadPatients, [debouncedQuery, isVet]);

  const patients = data?.patients ?? [];
  const pets = data?.pets ?? [];

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

      <ViewStateBoundary
        loading={loading}
        error={error}
        loadingMessage={`Carregando ${labels.patients.toLowerCase()}...`}
        onRetry={() => void reload()}
      >
        {isVet ? (
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
      </ViewStateBoundary>
    </div>
  );
}
