"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";
import { ENVIRONMENT_TYPES } from "@/lib/project/construction-modules";

type Environment = {
  id: string;
  name: string;
  environmentTypeLabel: string;
  length: number | null;
  width: number | null;
  height: number | null;
  floorArea: number | null;
  wallArea: number | null;
  ceilingArea: number | null;
};

export default function ProjectEnvironmentsPanel({ projectId }: { projectId: string }) {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    environmentType: "RESIDENCIAL",
    length: "",
    width: "",
    height: "",
  });

  const load = useCallback(async () => {
    const res = await fetch(`/api/interno/projects/${projectId}/environments`);
    const json = await res.json();
    if (res.ok) setEnvironments(json.environments as Environment[]);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    let active = true;
    (async () => {
      await load();
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch(`/api/interno/projects/${projectId}/environments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        environmentType: form.environmentType,
        length: form.length ? Number(form.length) : null,
        width: form.width ? Number(form.width) : null,
        height: form.height ? Number(form.height) : null,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg(json.error ?? "Erro");
      return;
    }
    setMsg("Ambiente adicionado — áreas calculadas automaticamente");
    setForm({ name: "", environmentType: "RESIDENCIAL", length: "", width: "", height: "" });
    await load();
  }

  if (loading) return <LoadingState message="Carregando ambientes…" />;

  return (
    <div className="space-y-4">
      {msg && <Alert tone="info">{msg}</Alert>}
      <form onSubmit={submit} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2">
          Nome do ambiente
          <input className="mt-1 w-full rounded-md border px-2 py-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label className="text-sm">
          Tipo
          <select className="mt-1 w-full rounded-md border px-2 py-1.5" value={form.environmentType} onChange={(e) => setForm({ ...form, environmentType: e.target.value })}>
            {ENVIRONMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Comprimento (m)
          <input type="number" step="0.01" className="mt-1 w-full rounded-md border px-2 py-1.5" value={form.length} onChange={(e) => setForm({ ...form, length: e.target.value })} />
        </label>
        <label className="text-sm">
          Largura (m)
          <input type="number" step="0.01" className="mt-1 w-full rounded-md border px-2 py-1.5" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} />
        </label>
        <label className="text-sm">
          Altura (m)
          <input type="number" step="0.01" className="mt-1 w-full rounded-md border px-2 py-1.5" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
        </label>
        <button type="submit" className="rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm text-white sm:col-span-2">Calcular áreas e salvar</button>
      </form>
      <div className="grid gap-3 sm:grid-cols-2">
        {environments.map((env) => (
          <article key={env.id} className="rounded-xl border p-4 text-sm">
            <h4 className="font-medium">{env.name}</h4>
            <p className="text-[var(--text-muted)]">{env.environmentTypeLabel}</p>
            <dl className="mt-2 grid grid-cols-3 gap-2">
              <div><dt className="text-xs text-[var(--text-muted)]">Piso</dt><dd>{env.floorArea?.toFixed(2) ?? "—"} m²</dd></div>
              <div><dt className="text-xs text-[var(--text-muted)]">Parede</dt><dd>{env.wallArea?.toFixed(2) ?? "—"} m²</dd></div>
              <div><dt className="text-xs text-[var(--text-muted)]">Teto</dt><dd>{env.ceilingArea?.toFixed(2) ?? "—"} m²</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}
