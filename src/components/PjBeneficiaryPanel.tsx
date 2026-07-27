"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { PatientExtraFields, emptyPatientExtra } from "@/components/cadastros/CadastroExtraFields";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useLabels } from "@/hooks/useLabels";
import { fetchJson } from "@/lib/ui/api-feedback";

const fieldClass =
  "mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-sm";

export type PjBeneficiaryRow = {
  id: string;
  name: string;
  cpf: string;
};

type Props = {
  onChanged: () => void;
  editing: PjBeneficiaryRow | null;
  onCancelEdit: () => void;
};

type FormState = {
  name: string;
  cpf: string;
  birthDate: string;
  phone: string;
  extra: ReturnType<typeof emptyPatientExtra>;
};

const emptyForm = (): FormState => ({
  name: "",
  cpf: "",
  birthDate: "",
  phone: "",
  extra: emptyPatientExtra(),
});

export function usePjBeneficiaryDetach(onChanged: () => void) {
  const { labels } = useLabels();
  const { run } = useAsyncAction();

  return async (id: string, name: string) => {
    if (
      !window.confirm(
        `Remover ${name} do plano corporativo? O cadastro clínico permanece no sistema.`,
      )
    ) {
      return;
    }
    await run({
      action: () =>
        fetchJson(`/api/pj/beneficiaries/${id}`, { method: "DELETE" }, "Não foi possível remover"),
      successMessage: `${labels.beneficiary} desvinculado(a) da empresa.`,
      onSuccess: onChanged,
    });
  };
}

export default function PjBeneficiaryForm({ onChanged, editing, onCancelEdit }: Props) {
  const { labels } = useLabels();
  const { run, isBusy } = useAsyncAction();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  const isEditing = Boolean(editing);
  const visible = creating || isEditing;

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        cpf: editing.cpf.replace(/\D/g, ""),
        birthDate: "",
        phone: "",
        extra: emptyPatientExtra(),
      });
      setCreating(false);
    }
  }, [editing]);

  function openCreate() {
    setForm(emptyForm());
    setCreating(true);
    onCancelEdit();
  }

  function cancel() {
    setCreating(false);
    setForm(emptyForm());
    onCancelEdit();
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      cpf: form.cpf.trim(),
      birthDate: form.birthDate || undefined,
      phone: form.phone.trim() || null,
      email: form.extra.email.trim() || null,
      gender: form.extra.gender || null,
      motherName: form.extra.motherName.trim() || null,
      employeeId: form.extra.employeeId.trim() || null,
      bondType: form.extra.bondType || null,
    };

    if (isEditing && editing) {
      await run({
        action: () =>
          fetchJson(
            `/api/pj/beneficiaries/${editing.id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            },
            "Não foi possível atualizar",
          ),
        successMessage: `${labels.beneficiary} atualizado(a).`,
        onSuccess: () => {
          cancel();
          onChanged();
        },
      });
      return;
    }

    if (!payload.birthDate) return;

    await run({
      action: () =>
        fetchJson(
          "/api/pj/beneficiaries",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
          "Não foi possível incluir",
        ),
      successMessage: `${labels.beneficiary} incluído(a) no plano corporativo.`,
      onSuccess: () => {
        cancel();
        onChanged();
      },
    });
  }

  return (
    <div className="mb-4 space-y-3">
      {!visible && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-[var(--text-muted)]">
            Inclua ou atualize {labels.beneficiaries.toLowerCase()} sem depender da recepção.
          </p>
          <Button type="button" size="sm" onClick={openCreate}>
            Incluir {labels.beneficiary.toLowerCase()}
          </Button>
        </div>
      )}

      {visible && (
        <Card padding="md">
          <form onSubmit={(e) => void submitForm(e)} className="space-y-4">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {isEditing ? "Editar dados" : `Novo ${labels.beneficiary.toLowerCase()}`}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="text-[var(--text-secondary)]">Nome</span>
                <input
                  required
                  className={fieldClass}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">CPF</span>
                <input
                  required
                  className={fieldClass}
                  value={form.cpf}
                  onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))}
                  disabled={isEditing}
                  readOnly={isEditing}
                />
              </label>
              {!isEditing && (
                <label className="block text-sm">
                  <span className="text-[var(--text-secondary)]">Data de nascimento</span>
                  <input
                    required
                    type="date"
                    className={fieldClass}
                    value={form.birthDate}
                    onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
                  />
                </label>
              )}
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">Telefone</span>
                <input
                  className={fieldClass}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </label>
            </div>
            <PatientExtraFields
              values={form.extra}
              onChange={(patch) => setForm((f) => ({ ...f, extra: { ...f.extra, ...patch } }))}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm" disabled={isBusy}>
                {isEditing ? "Salvar" : "Incluir"}
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={cancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
