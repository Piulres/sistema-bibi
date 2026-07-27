"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import SectionHeader from "@/components/ui/SectionHeader";
import { COMMON_MEDICATIONS } from "@/lib/clinical/prescription-medications";

const fieldClass =
  "w-full min-w-0 rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2.5 text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]";

type ItemDraft = {
  medication: string;
  dosage: string;
  frequency: string;
  route: string;
  durationDays: string;
  quantity: string;
  notes: string;
};

type PrescriptionDocument = {
  id: string;
  prescriptionKindLabel: string;
  title: string | null;
  createdAtLabel: string;
  providerName: string;
  itemCount: number;
  items: {
    medication: string;
    dosage: string;
    frequency: string;
    route: string | null;
    quantity: string | null;
  }[];
};

const emptyItem = (): ItemDraft => ({
  medication: "",
  dosage: "",
  frequency: "",
  route: "",
  durationDays: "",
  quantity: "",
  notes: "",
});

type Props = {
  patientId: string;
  appointmentId?: string;
  petId?: string;
  onChanged?: () => void;
};

export default function PrescriptionDocumentForm({
  patientId,
  appointmentId,
  petId,
  onChanged,
}: Props) {
  const [documents, setDocuments] = useState<PrescriptionDocument[]>([]);
  const [items, setItems] = useState<ItemDraft[]>([emptyItem()]);
  const [prescriptionKind, setPrescriptionKind] = useState("COMUM");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    const query = appointmentId ? `?appointmentId=${appointmentId}` : "";
    const res = await fetch(`/api/prestador/patients/${patientId}/prescription-documents${query}`);
    const data = await res.json();
    if (res.ok) setDocuments(data.documents ?? []);
  }, [patientId, appointmentId]);

  useEffect(() => {
    let active = true;
    (async () => {
      await loadDocuments();
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [loadDocuments]);

  function updateItem(index: number, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItemRow() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItemRow(index: number) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function applyTemplate(template: (typeof COMMON_MEDICATIONS)[number]) {
    setItems((prev) => {
      const last = prev[prev.length - 1];
      if (!last.medication && !last.dosage) {
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            medication: template.name,
            dosage: template.dosage,
            frequency: template.frequency,
          },
        ];
      }
      return [
        ...prev,
        {
          ...emptyItem(),
          medication: template.name,
          dosage: template.dosage,
          frequency: template.frequency,
        },
      ];
    });
  }

  async function submitDocument() {
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch(`/api/prestador/patients/${patientId}/prescription-documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          petId,
          prescriptionKind,
          title: title || undefined,
          notes: notes || undefined,
          items: items.map((item) => ({
            medication: item.medication,
            dosage: item.dosage,
            frequency: item.frequency,
            route: item.route || undefined,
            durationDays: item.durationDays ? Number(item.durationDays) : undefined,
            quantity: item.quantity || undefined,
            notes: item.notes || undefined,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao emitir receita");
        return;
      }
      setMsg(`Receita emitida com ${data.document?.itemCount ?? items.length} item(ns).`);
      setItems([emptyItem()]);
      setTitle("");
      setNotes("");
      await loadDocuments();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 border-t border-[var(--border-default)] pt-4">
      <SectionHeader
        title="Receita multi-item"
        description="Prescrição elaborada com vários medicamentos em um único documento."
      />

      {msg && <Alert tone="success">{msg}</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}

      <div className="flex flex-wrap gap-2">
        {COMMON_MEDICATIONS.map((med) => (
          <button
            key={med.name}
            type="button"
            onClick={() => applyTemplate(med)}
            className="rounded-full border border-[var(--border-muted)] px-3 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
          >
            + {med.name}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <select
          className={fieldClass}
          value={prescriptionKind}
          onChange={(e) => setPrescriptionKind(e.target.value)}
        >
          <option value="COMUM">Receita comum</option>
          <option value="CONTROLE_ESPECIAL">Receita de controle especial</option>
        </select>
        <input
          className={fieldClass}
          placeholder="Título (ex.: Pré-colonoscopia)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {items.map((item, index) => (
        <div
          key={index}
          className="space-y-2 rounded-md border border-[var(--border-muted)] p-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Medicamento {index + 1}
            </p>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItemRow(index)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--danger)]"
              >
                Remover
              </button>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className={fieldClass}
              placeholder="Medicamento"
              value={item.medication}
              onChange={(e) => updateItem(index, { medication: e.target.value })}
            />
            <input
              className={fieldClass}
              placeholder="Dose"
              value={item.dosage}
              onChange={(e) => updateItem(index, { dosage: e.target.value })}
            />
            <input
              className={fieldClass}
              placeholder="Frequência"
              value={item.frequency}
              onChange={(e) => updateItem(index, { frequency: e.target.value })}
            />
            <input
              className={fieldClass}
              placeholder="Via (opcional)"
              value={item.route}
              onChange={(e) => updateItem(index, { route: e.target.value })}
            />
            <input
              className={fieldClass}
              placeholder="Duração (dias)"
              type="number"
              value={item.durationDays}
              onChange={(e) => updateItem(index, { durationDays: e.target.value })}
            />
            <input
              className={fieldClass}
              placeholder="Quantidade"
              value={item.quantity}
              onChange={(e) => updateItem(index, { quantity: e.target.value })}
            />
            <input
              className={`sm:col-span-2 ${fieldClass}`}
              placeholder="Observações do item"
              value={item.notes}
              onChange={(e) => updateItem(index, { notes: e.target.value })}
            />
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={addItemRow} disabled={busy}>
          + Adicionar medicamento
        </Button>
        <Button onClick={() => void submitDocument()} disabled={busy}>
          Emitir receita
        </Button>
      </div>

      <input
        className={fieldClass}
        placeholder="Observações gerais da receita"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--text-secondary)]">Receitas deste atendimento</p>
          <ul className="divide-y divide-[var(--border-default)] rounded-md border border-[var(--border-muted)]">
            {documents.map((doc) => (
              <li key={doc.id} className="p-3">
                <p className="font-medium">
                  {doc.title ?? doc.prescriptionKindLabel} · {doc.createdAtLabel}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {doc.providerName} · {doc.itemCount} item(ns)
                </p>
                <ul className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
                  {doc.items.map((item, i) => (
                    <li key={i}>
                      {item.medication} — {item.dosage}, {item.frequency}
                      {item.route ? ` (${item.route})` : ""}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
