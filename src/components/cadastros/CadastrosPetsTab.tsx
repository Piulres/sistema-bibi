"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { useLabels } from "@/hooks/useLabels";
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

const fieldClass =
  "mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-sm";

export default function CadastrosPetsTab() {
  const { labels } = useLabels();
  const [pets, setPets] = useState<PetRow[]>([]);
  const [tutors, setTutors] = useState<TutorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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

  useEffect(() => {
    let active = true;
    (async () => {
      const [petsRes, patientsRes] = await Promise.all([
        fetch("/api/interno/pets"),
        fetch("/api/interno/patients"),
      ]);
      const petsData = await petsRes.json();
      const patientsData = await patientsRes.json();
      if (!active) return;
      setPets(petsData.pets ?? []);
      setTutors(
        (patientsData.patients ?? []).map((p: { id: string; name: string; cpf: string }) => ({
          id: p.id,
          name: p.name,
          cpf: p.cpf,
        })),
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

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

  async function reload() {
    const [petsRes, patientsRes] = await Promise.all([
      fetch("/api/interno/pets"),
      fetch("/api/interno/patients"),
    ]);
    const petsData = await petsRes.json();
    const patientsData = await patientsRes.json();
    setPets(petsData.pets ?? []);
    setTutors(
      (patientsData.patients ?? []).map((p: { id: string; name: string; cpf: string }) => ({
        id: p.id,
        name: p.name,
        cpf: p.cpf,
      })),
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
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

      const res = await fetch(
        editingId ? `/api/interno/pets/${editingId}` : "/api/interno/pets",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "Erro ao salvar pet");
        return;
      }
      setMsg(editingId ? `${labels.patient} atualizado` : `${labels.patient} cadastrado`);
      resetForm();
      await reload();
    } finally {
      setBusy(false);
    }
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

  if (loading) return <LoadingState message={`Carregando ${labels.patients.toLowerCase()}...`} />;

  return (
    <div className="space-y-6">
      {msg && <Alert tone="success">{msg}</Alert>}

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
            <Button type="submit" disabled={busy}>
              {busy ? "Salvando..." : editingId ? "Atualizar" : "Cadastrar"}
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
  );
}
