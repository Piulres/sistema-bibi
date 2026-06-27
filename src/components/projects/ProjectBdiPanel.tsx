"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";

type Bdi = {
  administration: number;
  risk: number;
  profit: number;
  taxes: number;
  financial: number;
  totalPercent: number;
};

export default function ProjectBdiPanel({
  projectId,
  budgetId,
}: {
  projectId: string;
  budgetId: string | undefined;
}) {
  const [bdi, setBdi] = useState<Bdi>({
    administration: 5,
    risk: 3,
    profit: 10,
    taxes: 5,
    financial: 2,
    totalPercent: 25,
  });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [budgetTotal, setBudgetTotal] = useState(0);

  const load = useCallback(async () => {
    if (!budgetId) {
      setLoading(false);
      return;
    }
    const res = await fetch(`/api/interno/projects/${projectId}/bdi?budgetId=${budgetId}`);
    const json = await res.json();
    if (res.ok && json.breakdown) {
      setBdi(json.breakdown as Bdi);
    }
    setLoading(false);
  }, [projectId, budgetId]);

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

  async function save() {
    if (!budgetId) return;
    setMsg(null);
    const res = await fetch(`/api/interno/projects/${projectId}/bdi`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budgetId, ...bdi }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg(json.error ?? "Erro");
      return;
    }
    setBudgetTotal(json.budgetTotal as number);
    setBdi(json.data as Bdi);
    setMsg("BDI atualizado — total do orçamento recalculado");
  }

  if (!budgetId) return <p className="text-sm text-[var(--text-muted)]">Nenhum orçamento ativo.</p>;
  if (loading) return <LoadingState message="Carregando BDI…" />;

  const fields: (keyof Omit<Bdi, "totalPercent">)[] = [
    "administration",
    "risk",
    "profit",
    "taxes",
    "financial",
  ];
  const labels: Record<string, string> = {
    administration: "Administração central (%)",
    risk: "Risco (%)",
    profit: "Lucro (%)",
    taxes: "Impostos (%)",
    financial: "Financeiro (%)",
  };

  const total =
    bdi.administration + bdi.risk + bdi.profit + bdi.taxes + bdi.financial;

  return (
    <div className="space-y-4">
      {msg && <Alert tone="info">{msg}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f} className="text-sm">
            {labels[f]}
            <input
              type="number"
              step="0.1"
              min={0}
              className="mt-1 w-full rounded-md border px-2 py-1.5"
              value={bdi[f]}
              onChange={(e) => setBdi({ ...bdi, [f]: Number(e.target.value) })}
            />
          </label>
        ))}
      </div>
      <p className="text-sm font-medium">BDI total: {total.toFixed(1)}%</p>
      {budgetTotal > 0 && (
        <p className="text-sm text-[var(--text-secondary)]">
          Total orçamento: {budgetTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>
      )}
      <button
        type="button"
        onClick={save}
        className="rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm text-white"
      >
        Aplicar BDI decomposto
      </button>
    </div>
  );
}
