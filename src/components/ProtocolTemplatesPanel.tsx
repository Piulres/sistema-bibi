"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import StatusBadge from "@/components/ui/StatusBadge";
import type { ProtocolChecklistItem } from "@/lib/clinical/constants";

type Template = {
  id: string;
  name: string;
  specialty: string | null;
  checklist: ProtocolChecklistItem[];
  suggestedReturnDays: number | null;
  active: boolean;
};

const fieldClass =
  "mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-sm";

export default function ProtocolTemplatesPanel() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function reloadTemplates() {
    const res = await fetch("/api/interno/protocol-templates");
    const data = await res.json();
    if (res.ok) setTemplates(data.templates);
  }
  const [form, setForm] = useState({
    name: "",
    specialty: "",
    suggestedReturnDays: "",
    checklistText: "",
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/interno/protocol-templates");
      const data = await res.json();
      if (!active) return;
      if (res.ok) setTemplates(data.templates);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function createTemplate() {
    const checklist: ProtocolChecklistItem[] = form.checklistText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((label, index) => ({ id: `item-${index + 1}`, label, required: true }));

    if (!form.name.trim() || checklist.length === 0) {
      setMsg("Informe nome e itens do checklist (um por linha).");
      return;
    }

    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/interno/protocol-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          specialty: form.specialty || undefined,
          suggestedReturnDays: form.suggestedReturnDays ? Number(form.suggestedReturnDays) : undefined,
          checklist,
        }),
      });
      if (res.ok) {
        setForm({ name: "", specialty: "", suggestedReturnDays: "", checklistText: "" });
        setMsg("Protocolo criado.");
        await reloadTemplates();
      }
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(template: Template) {
    setBusy(true);
    try {
      await fetch(`/api/interno/protocol-templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !template.active }),
      });
      await reloadTemplates();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {msg && <Alert tone="success">{msg}</Alert>}

      <div className="grid gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Nome do protocolo</label>
          <input className={fieldClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium">Especialidade</label>
          <input className={fieldClass} value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium">Retorno sugerido (dias)</label>
          <input type="number" className={fieldClass} value={form.suggestedReturnDays} onChange={(e) => setForm({ ...form, suggestedReturnDays: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Checklist (um item por linha)</label>
          <textarea rows={4} className={fieldClass} value={form.checklistText} onChange={(e) => setForm({ ...form, checklistText: e.target.value })} />
        </div>
        <Button onClick={createTemplate} disabled={busy}>Criar protocolo</Button>
      </div>

      <div className="space-y-3">
        {templates.map((t) => (
          <article key={t.id} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{t.name}</p>
                {t.specialty && <p className="text-sm text-[var(--text-muted)]">{t.specialty}</p>}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={t.active ? "ATIVO" : "CANCELADO"} label={t.active ? "Ativo" : "Inativo"} />
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => toggleActive(t)}>
                  {t.active ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </div>
            <ul className="mt-2 list-inside list-disc text-sm text-[var(--text-secondary)]">
              {t.checklist.map((item) => (
                <li key={item.id}>{item.label}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
