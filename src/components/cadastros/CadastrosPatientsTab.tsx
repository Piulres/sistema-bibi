"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import {
  PatientExtraFields,
  emptyPatientExtra,
} from "@/components/cadastros/CadastroExtraFields";
import ImportInterchangePanel from "@/components/cadastros/ImportInterchangePanel";
import {
  CADASTROS_FIELD_CLASS,
  type CompanyRow,
  type PatientRow,
} from "@/components/cadastros/types";
import { useLabels } from "@/hooks/useLabels";
import { useFormUndo } from "@/hooks/useFormUndo";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { fetchJson } from "@/lib/ui/api-feedback";

type PatientsPayload = {
  patients: PatientRow[];
  companies: CompanyRow[];
};

export default function CadastrosPatientsTab() {
  const { labels } = useLabels();
  const { isBusy, run, showToast } = useAsyncAction();
  const fieldClass = CADASTROS_FIELD_CLASS;

  const [patientForm, setPatientForm] = useState({
    name: "",
    cpf: "",
    birthDate: "",
    phone: "",
    companyId: "",
    ...emptyPatientExtra(),
  });
  const [editingPatient, setEditingPatient] = useState<PatientRow | null>(null);
  const patientEditUndo = useFormUndo<PatientRow | null>(null);

  const loadPatients = useCallback(async () => {
    const [pRes, cRes] = await Promise.all([
      fetchJson<{ patients?: PatientRow[] }>(
        "/api/interno/patients",
        undefined,
        "Erro ao carregar beneficiários",
      ),
      fetchJson<{ companies?: CompanyRow[] }>(
        "/api/interno/companies",
        undefined,
        "Erro ao carregar empresas",
      ),
    ]);
    if (!pRes.ok) return pRes;
    if (!cRes.ok) return cRes;
    return {
      ok: true as const,
      data: {
        patients: pRes.data.patients ?? [],
        companies: cRes.data.companies ?? [],
      },
      status: 200,
    };
  }, []);

  const { data, loading, error, reload } = useAsyncData<PatientsPayload>(loadPatients, [], {
    forbiddenMessage: "Sem permissão para acessar cadastros",
  });

  const patients = data?.patients ?? [];
  const companies = data?.companies ?? [];

  async function submitPatient(e: React.FormEvent) {
    e.preventDefault();
    await run(
      "patient",
      () =>
        fetch("/api/interno/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...patientForm,
            companyId: patientForm.companyId || null,
          }),
        }),
      {
        silentSuccess: true,
        onSuccess: async (body) => {
          const patient = body.patient as { name: string };
          showToast({ message: `${labels.beneficiary} ${patient.name} cadastrado(a)`, tone: "success" });
          setPatientForm({
            name: "",
            cpf: "",
            birthDate: "",
            phone: "",
            companyId: "",
            ...emptyPatientExtra(),
          });
          await reload();
        },
      },
    );
  }

  async function savePatientEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPatient) return;
    const patientId = editingPatient.id;
    await run(
      `edit-patient-${patientId}`,
      () =>
        fetch(`/api/interno/patients/${patientId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editingPatient.name,
            cpf: editingPatient.cpf,
            birthDate: editingPatient.birthDate,
            phone: editingPatient.phone,
            email: editingPatient.email,
            gender: editingPatient.gender,
            motherName: editingPatient.motherName,
            employeeId: editingPatient.employeeId,
            bondType: editingPatient.bondType,
            companyId: editingPatient.companyId,
          }),
        }),
      {
        silentSuccess: true,
        onSuccess: async (body) => {
          const patient = body.patient as { id: string; name: string };
          setEditingPatient(null);
          patientEditUndo.reset(null);
          await reload();
          showToast({
            message: `${patient.name} atualizado`,
            actionLabel: "Desfazer",
            tone: "success",
            onAction: async () => {
              const revertRes = await fetch("/api/interno/change/revert-recent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ entityType: "Patient", entityId: patient.id }),
              });
              if (revertRes.ok) {
                await reload();
                showToast({ message: "Alteração desfeita", tone: "info" });
              }
            },
          });
        },
      },
    );
  }

  return (
    <ViewStateBoundary
      loading={loading}
      error={error}
      loadingMessage={`Carregando ${labels.beneficiaries.toLowerCase()}...`}
      onRetry={() => void reload()}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ImportInterchangePanel
          entity="patients"
          entityLabel={labels.patient}
          onImported={() => void reload()}
        />
        <Card>
          <SectionHeader title="Novo beneficiário" />
          <form onSubmit={submitPatient} className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Nome</span>
              <input
                required
                className={fieldClass}
                value={patientForm.name}
                onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">CPF</span>
              <input
                required
                className={fieldClass}
                value={patientForm.cpf}
                onChange={(e) => setPatientForm({ ...patientForm, cpf: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Nascimento</span>
              <input
                required
                type="date"
                className={fieldClass}
                value={patientForm.birthDate}
                onChange={(e) => setPatientForm({ ...patientForm, birthDate: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Telefone (opcional)</span>
              <input
                className={fieldClass}
                value={patientForm.phone}
                onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Empresa (opcional)</span>
              <select
                className={fieldClass}
                value={patientForm.companyId}
                onChange={(e) => setPatientForm({ ...patientForm, companyId: e.target.value })}
              >
                <option value="">Particular</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <PatientExtraFields
              values={{
                email: patientForm.email,
                gender: patientForm.gender,
                motherName: patientForm.motherName,
                employeeId: patientForm.employeeId,
                bondType: patientForm.bondType,
              }}
              onChange={(patch) => setPatientForm({ ...patientForm, ...patch })}
            />
            <Button type="submit" variant="portal" disabled={isBusy("patient")}>
              {isBusy("patient") ? "Salvando..." : "Cadastrar"}
            </Button>
          </form>
        </Card>
        <Card>
          <SectionHeader title={labels.beneficiaries} />
          {patients.length === 0 ? (
            <EmptyState message={`Nenhum registro de ${labels.beneficiary.toLowerCase()}.`} />
          ) : (
            <ul className="mt-4 divide-y divide-[var(--border-default)]">
              {patients.map((p) => (
                <li key={p.id} className="py-3 text-sm">
                  {editingPatient?.id === p.id ? (
                    <form onSubmit={savePatientEdit} className="space-y-2 rounded border border-[var(--border-muted)] p-3">
                      <input
                        required
                        className={fieldClass}
                        value={editingPatient.name}
                        onChange={(e) =>
                          setEditingPatient({ ...editingPatient, name: e.target.value })
                        }
                      />
                      <input
                        required
                        className={fieldClass}
                        value={editingPatient.cpf}
                        onChange={(e) =>
                          setEditingPatient({ ...editingPatient, cpf: e.target.value })
                        }
                      />
                      <input
                        required
                        type="date"
                        className={fieldClass}
                        value={editingPatient.birthDate}
                        onChange={(e) =>
                          setEditingPatient({ ...editingPatient, birthDate: e.target.value })
                        }
                      />
                      <input
                        className={fieldClass}
                        placeholder="Telefone"
                        value={editingPatient.phone ?? ""}
                        onChange={(e) =>
                          setEditingPatient({ ...editingPatient, phone: e.target.value || null })
                        }
                      />
                      <select
                        className={fieldClass}
                        value={editingPatient.companyId ?? ""}
                        onChange={(e) =>
                          setEditingPatient({
                            ...editingPatient,
                            companyId: e.target.value || null,
                          })
                        }
                      >
                        <option value="">Particular</option>
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <PatientExtraFields
                        values={{
                          email: editingPatient.email ?? "",
                          gender: editingPatient.gender ?? "",
                          motherName: editingPatient.motherName ?? "",
                          employeeId: editingPatient.employeeId ?? "",
                          bondType: editingPatient.bondType ?? "",
                        }}
                        onChange={(patch) =>
                          setEditingPatient({
                            ...editingPatient,
                            ...patch,
                            email: patch.email ?? editingPatient.email,
                            gender: patch.gender ?? editingPatient.gender,
                            motherName: patch.motherName ?? editingPatient.motherName,
                            employeeId: patch.employeeId ?? editingPatient.employeeId,
                            bondType: patch.bondType ?? editingPatient.bondType,
                          })
                        }
                      />
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          size="sm"
                          variant="portal"
                          disabled={isBusy(`edit-patient-${p.id}`)}
                        >
                          Salvar
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => setEditingPatient(null)}>
                          Cancelar
                        </Button>
                        {patientEditUndo.canUndo && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const restored = patientEditUndo.undo();
                              if (restored) setEditingPatient(restored);
                            }}
                          >
                            Desfazer (Ctrl+Z)
                          </Button>
                        )}
                      </div>
                    </form>
                  ) : (
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/interno/beneficiarios/${p.id}?from=/interno/cadastros`}
                          className="ds-touch-link break-words px-0 font-medium"
                        >
                          {p.name}
                        </Link>
                        <p className="break-words text-sm text-[var(--text-muted)]">
                          {p.cpf}
                        </p>
                        <p className="break-words text-sm text-[var(--text-muted)]">
                          {p.companyName ?? "Particular"}
                          {p.phone ? ` · ${p.phone}` : ""}
                        </p>
                      </div>
                      <Button type="button" size="sm" variant="ghost" className="shrink-0" onClick={() => {
                        patientEditUndo.reset({ ...p });
                        setEditingPatient({ ...p });
                      }}>
                        Editar
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </ViewStateBoundary>
  );
}
