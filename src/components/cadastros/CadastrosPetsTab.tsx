"use client";

import { useCallback, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { useLabels } from "@/hooks/useLabels";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { fetchJson } from "@/lib/ui/api-feedback";
import {
  PET_SEX,
  PET_SIZES,
  PET_SPECIES,
  PET_SPECIES_LABELS,
  PET_SIZE_LABELS,
} from "@/lib/pet-constants";

type PetRow = {
  id: string;
  name: string;
  species: string;
  speciesLabel: string;
  breed: string | null;
  sex: string | null;
  birthDate: string | null;
  size: string | null;
  sizeLabel: string | null;
  weightKg: number | null;
  status: string;
  tutorName: string;
  tutorCpf: string;
  companyName: string | null;
  patientId: string;
};

type TutorOption = { id: string; name: string; cpf: string };

type PetsPayload = {
  pets: PetRow[];
  tutors: TutorOption[];
};

const fieldClass =
  "mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-sm";

export default function CadastrosPetsTab() {
  const { labels } = useLabels();
  const { isBusy, run } = useAsyncAction();
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    patientId: "",
    name: "",
    species: "CANINO",
    breed: "",
    sex: "M",
    size: "MEDIO",
    weightKg: "",
    notes: "",
  });

  const loadPets = useCallback(async () => {
    const [petsRes, patientsRes] = await Promise.all([
      fetchJson<{ pets?: PetRow[] }>("/api/interno/pets", undefined, "Erro ao carregar pets"),
      fetchJson<{ patients?: { id: string; name: string; cpf: string }[] }>(
        "/api/interno/patients",
        undefined,
        "Erro ao carregar tutores",
      ),
    ]);
    if (!petsRes.ok) return petsRes;
    if (!patientsRes.ok) return patientsRes;
    return {
      ok: true as const,
      data: {
        pets: petsRes.data.pets ?? [],
        tutors: (patientsRes.data.patients ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          cpf: p.cpf,
        })),
      },
      status: 200,
    };
  }, []);

  const { data, loading, error, reload } = useAsyncData<PetsPayload>(loadPets, []);

  const pets = data?.pets ?? [];
  const tutors = data?.tutors ?? [];

  function resetForm() {
    setEditingId(null);
    setForm({
      patientId: "",
      name: "",
      species: "CANINO",
      breed: "",
      sex: "M",
      size: "MEDIO",
      weightKg: "",
      notes: "",
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      patientId: form.patientId,
      name: form.name,
      species: form.species,
      breed: form.breed || null,
      sex: form.sex,
      size: form.size,
      weightKg: form.weightKg ? Number(form.weightKg) : null,
      notes: form.notes || null,
    };

    const key = editingId ? `edit-pet-${editingId}` : "create-pet";
    await run(
      key,
      () =>
        fetch(editingId ? `/api/interno/pets/${editingId}` : "/api/interno/pets", {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      {
        successMessage: editingId
          ? `${labels.patient} atualizado`
          : `${labels.patient} cadastrado`,
        onSuccess: async () => {
          resetForm();
          await reload();
        },
      },
    );
  }

  function startEdit(p: PetRow) {
    setEditingId(p.id);
    setForm({
      patientId: p.patientId,
      name: p.name,
      species: p.species,
      breed: p.breed ?? "",
      sex: p.sex ?? "M",
      size: p.size ?? "MEDIO",
      weightKg: p.weightKg != null ? String(p.weightKg) : "",
      notes: "",
    });
  }

  const formBusy = isBusy("create-pet") || (editingId ? isBusy(`edit-pet-${editingId}`) : false);

  return (
    <ViewStateBoundary
      loading={loading}
      error={error}
      loadingMessage={`Carregando ${labels.patients.toLowerCase()}...`}
      onRetry={() => void reload()}
    >
      <div className="space-y-6">
        <Card padding="md">
          <SectionHeader
            title={editingId ? `Editar ${labels.patient.toLowerCase()}` : `Novo ${labels.patient.toLowerCase()}`}
            description={`Vincule o ${labels.patient.toLowerCase()} ao ${labels.beneficiary.toLowerCase()} responsável.`}
          />
          <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-sm sm:col-span-2">
              <span className="text-[var(--text-secondary)]">{labels.beneficiary}</span>
              <select
                required
                disabled={!!editingId}
                className={fieldClass}
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              >
                <option value="">Selecione...</option>
                {tutors.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — CPF {t.cpf}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Nome</span>
              <input
                required
                className={fieldClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Espécie</span>
              <select
                className={fieldClass}
                value={form.species}
                onChange={(e) => setForm({ ...form, species: e.target.value })}
              >
                {PET_SPECIES.map((s) => (
                  <option key={s} value={s}>{PET_SPECIES_LABELS[s]}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Raça</span>
              <input
                className={fieldClass}
                value={form.breed}
                onChange={(e) => setForm({ ...form, breed: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Porte</span>
              <select
                className={fieldClass}
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
              >
                {PET_SIZES.map((s) => (
                  <option key={s} value={s}>{PET_SIZE_LABELS[s]}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Peso (kg)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                className={fieldClass}
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Sexo</span>
              <select
                className={fieldClass}
                value={form.sex}
                onChange={(e) => setForm({ ...form, sex: e.target.value })}
              >
                {PET_SEX.map((s) => (
                  <option key={s} value={s}>{s === "M" ? "Macho" : s === "F" ? "Fêmea" : "Não informado"}</option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={formBusy}>
                {formBusy ? "Salvando..." : editingId ? "Atualizar" : "Cadastrar"}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Card>

        {pets.length === 0 ? (
          <EmptyState
            title={`Nenhum ${labels.patient.toLowerCase()} cadastrado`}
            message={`Cadastre o primeiro ${labels.patient.toLowerCase()} vinculado a um tutor.`}
          />
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border-muted)]">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--surface-muted)] text-left text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-2">Nome</th>
                  <th className="px-4 py-2">Espécie / Raça</th>
                  <th className="px-4 py-2">{labels.beneficiary}</th>
                  <th className="px-4 py-2">Porte</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {pets.map((p) => (
                  <tr key={p.id} className="border-t border-[var(--border-muted)]">
                    <td className="px-4 py-2 font-medium">{p.name}</td>
                    <td className="px-4 py-2">{p.speciesLabel}{p.breed ? ` · ${p.breed}` : ""}</td>
                    <td className="px-4 py-2">{p.tutorName}</td>
                    <td className="px-4 py-2">{p.sizeLabel ?? "—"}</td>
                    <td className="px-4 py-2"><StatusBadge value={p.status} /></td>
                    <td className="px-4 py-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(p)}>
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ViewStateBoundary>
  );
}
