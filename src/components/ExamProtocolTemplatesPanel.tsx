"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import StatusBadge from "@/components/ui/StatusBadge";
import type { ExamProtocolItem } from "@/lib/clinical/constants";

type Template = {
  id: string;
  name: string;
  specialty: string | null;
  exams: ExamProtocolItem[];
  clinicalIndication: string | null;
  active: boolean;
};

const fieldClass =
  "mt-1 w-full min-w-0 rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2.5 text-sm";

function examsToText(items: ExamProtocolItem[]): string {
  return items.map((item) => item.examName).join("\n");
}

function parseExams(text: string): ExamProtocolItem[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((examName, index) => ({ id: `exam-${index + 1}`, examName }));
}

export default function ExamProtocolTemplatesPanel() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    specialty: "",
    clinicalIndication: "",
    examsText: "",
  });

  async function reloadTemplates() {
    const res = await fetch("/api/interno/exam-protocol-templates");
    const data = await res.json();
    if (res.ok) setTemplates(data.templates);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/interno/exam-protocol-templates");
      const data = await res.json();
      if (!active) return;
      if (res.ok) setTemplates(data.templates);
    })();
    return () => {
      active = false;
    };
  }, []);

  function startEdit(template: Template) {
    setEditingId(template.id);
    setForm({
      name: template.name,
      specialty: template.specialty ?? "",
      clinicalIndication: template.clinicalIndication ?? "",
      examsText: examsToText(template.exams),
    });
    setMsg(null);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ name: "", specialty: "", clinicalIndication: "", examsText: "" });
  }

  async function saveTemplate() {
    const exams = parseExams(form.examsText);
    if (!form.name.trim() || exams.length === 0) {
      setError("Informe nome e exames (um por linha).");
      return;
    }

    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const payload = {
        name: form.name,
        specialty: form.specialty || undefined,
        clinicalIndication: form.clinicalIndication || undefined,
        exams,
      };

      const res = await fetch(
        editingId
          ? `/api/interno/exam-protocol-templates/${editingId}`
          : "/api/interno/exam-protocol-templates",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError((data as { error?: string } | null)?.error ?? "Erro ao salvar protocolo");
        return;
      }
      cancelEdit();
      setMsg(editingId ? "Protocolo de exames atualizado." : "Protocolo de exames criado.");
      await reloadTemplates();
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(template: Template) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/interno/exam-protocol-templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !template.active }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError((data as { error?: string } | null)?.error ?? "Erro ao alterar status");
        return;
      }
      await reloadTemplates();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {msg && <Alert tone="success">{msg}</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}

      <div className="grid gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {editingId ? "Editar protocolo de exames" : "Novo protocolo de exames"}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Painéis reutilizáveis (pré-op, check-up, DM2…). No atendimento, aplica todos os pedidos de uma vez.
          </p>
        </div>
        <div className="min-w-0">
          <label className="text-sm font-medium">Nome do protocolo</label>
          <input
            className={fieldClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex.: Pré-operatório"
          />
        </div>
        <div className="min-w-0">
          <label className="text-sm font-medium">Especialidade</label>
          <input
            className={fieldClass}
            value={form.specialty}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
          />
        </div>
        <div className="min-w-0 sm:col-span-2">
          <label className="text-sm font-medium">Indicação clínica padrão</label>
          <input
            className={fieldClass}
            value={form.clinicalIndication}
            onChange={(e) => setForm({ ...form, clinicalIndication: e.target.value })}
            placeholder="Opcional — usada em cada pedido gerado"
          />
        </div>
        <div className="min-w-0 sm:col-span-2">
          <label className="text-sm font-medium">Exames (um por linha)</label>
          <textarea
            rows={5}
            className={fieldClass}
            value={form.examsText}
            onChange={(e) => setForm({ ...form, examsText: e.target.value })}
            placeholder={"Hemograma completo\nGlicemia de jejum\nCreatinina"}
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row">
          <Button onClick={saveTemplate} disabled={busy}>
            {editingId ? "Salvar alterações" : "Criar protocolo de exames"}
          </Button>
          {editingId && (
            <Button variant="secondary" onClick={cancelEdit} disabled={busy}>
              Cancelar edição
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {templates.length === 0 && (
          <p className="text-sm text-[var(--text-muted)]">Nenhum protocolo de exames cadastrado.</p>
        )}
        {templates.map((t) => (
          <article
            key={t.id}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold">{t.name}</p>
                {t.specialty && (
                  <p className="text-sm text-[var(--text-muted)]">{t.specialty}</p>
                )}
                {t.clinicalIndication && (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{t.clinicalIndication}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  value={t.active ? "ATIVO" : "CANCELADO"}
                  label={t.active ? "Ativo" : "Inativo"}
                />
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => startEdit(t)}>
                  Editar
                </Button>
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => toggleActive(t)}>
                  {t.active ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </div>
            <ul className="mt-2 list-inside list-disc text-sm text-[var(--text-secondary)]">
              {t.exams.map((item) => (
                <li key={item.id}>{item.examName}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
