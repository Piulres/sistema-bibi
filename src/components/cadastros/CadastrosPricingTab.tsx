"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";

type ProcedureRow = { id: string; code: string; name: string; basePriceLabel: string };
type CompanyRow = { id: string; name: string };

type PricingRuleRow = {
  id: string;
  description: string;
  multiplier: number;
  multiplierLabel: string;
  procedureCode: string;
  procedureName: string;
  basePriceLabel: string;
  effectivePriceLabel: string;
  companyName: string | null;
};

const fieldClass =
  "mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-card)] px-3 py-2 text-sm";

export default function CadastrosPricingTab() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [rules, setRules] = useState<PricingRuleRow[]>([]);
  const [procedures, setProcedures] = useState<ProcedureRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMultiplier, setEditMultiplier] = useState("1");

  const [form, setForm] = useState({
    procedureId: "",
    companyId: "",
    multiplier: "0.85",
    description: "",
  });

  const load = useCallback(async () => {
    const [rulesRes, procRes, compRes] = await Promise.all([
      fetch("/api/interno/pricing-rules"),
      fetch("/api/interno/procedures"),
      fetch("/api/interno/companies"),
    ]);
    const [rulesData, procData, compData] = await Promise.all([
      rulesRes.json(),
      procRes.json(),
      compRes.json(),
    ]);
    setRules(rulesData.rules ?? []);
    setProcedures(procData.procedures ?? []);
    setCompanies(compData.companies ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const [rulesRes, procRes, compRes] = await Promise.all([
        fetch("/api/interno/pricing-rules"),
        fetch("/api/interno/procedures"),
        fetch("/api/interno/companies"),
      ]);
      const [rulesData, procData, compData] = await Promise.all([
        rulesRes.json(),
        procRes.json(),
        compRes.json(),
      ]);
      if (!active) return;
      setRules(rulesData.rules ?? []);
      setProcedures(procData.procedures ?? []);
      setCompanies(compData.companies ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function createRule(e: React.FormEvent) {
    e.preventDefault();
    setBusy("create");
    setMsg(null);
    try {
      const res = await fetch("/api/interno/pricing-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procedureId: form.procedureId,
          companyId: form.companyId,
          multiplier: Number(form.multiplier),
          description: form.description || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao criar regra");
      else {
        setMsg("Regra de precificação criada");
        setForm({ procedureId: "", companyId: "", multiplier: "0.85", description: "" });
        await load();
      }
    } finally {
      setBusy(null);
    }
  }

  async function saveRule(id: string) {
    setBusy(id);
    setMsg(null);
    try {
      const res = await fetch(`/api/interno/pricing-rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ multiplier: Number(editMultiplier) }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao salvar");
      else {
        setEditingId(null);
        await load();
      }
    } finally {
      setBusy(null);
    }
  }

  async function removeRule(id: string) {
    setBusy(`del-${id}`);
    setMsg(null);
    try {
      const res = await fetch(`/api/interno/pricing-rules/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? "Erro ao excluir");
      else await load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <LoadingState message="Carregando regras de precificação..." />;

  return (
    <div className="space-y-6">
      {msg && <Alert tone="info">{msg}</Alert>}

      <Card>
        <SectionHeader
          title="Nova regra (desconto / margem B2B)"
          description="Multiplicador sobre o preço base do procedimento. Ex.: 0,85 = 15% de desconto. Afeta apenas novos registros de Pay Per Use."
        />
        <form onSubmit={createRule} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Empresa PJ</span>
            <select
              required
              className={fieldClass}
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            >
              <option value="">Selecione...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Procedimento</span>
            <select
              required
              className={fieldClass}
              value={form.procedureId}
              onChange={(e) => setForm({ ...form, procedureId: e.target.value })}
            >
              <option value="">Selecione...</option>
              {procedures.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name} ({p.basePriceLabel})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-secondary)]">Multiplicador</span>
            <input
              required
              type="number"
              min="0.01"
              max="3"
              step="0.01"
              className={fieldClass}
              value={form.multiplier}
              onChange={(e) => setForm({ ...form, multiplier: e.target.value })}
            />
            <span className="mt-1 block text-xs text-[var(--text-muted)]">
              1,0 = preço cheio · 0,85 = 15% off · 1,1 = 10% acréscimo
            </span>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-[var(--text-secondary)]">Descrição (opcional)</span>
            <input
              className={fieldClass}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" variant="portal" disabled={busy === "create"}>
              {busy === "create" ? "Salvando..." : "Cadastrar regra"}
            </Button>
          </div>
        </form>
      </Card>

      <section>
        <SectionHeader title="Regras ativas" />
        {rules.length === 0 ? (
          <EmptyState message="Nenhuma regra cadastrada. Particulares e empresas sem regra usam preço base (×1)." />
        ) : (
          <ul className="mt-4 space-y-3">
            {rules.map((rule) => (
              <li
                key={rule.id}
                className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      {rule.companyName} · {rule.procedureCode} — {rule.procedureName}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{rule.multiplierLabel}</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      Base {rule.basePriceLabel} → efetivo {rule.effectivePriceLabel}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{rule.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editingId === rule.id ? (
                      <>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          className="w-24 rounded border border-[var(--border-muted)] px-2 py-1 text-sm"
                          value={editMultiplier}
                          onChange={(e) => setEditMultiplier(e.target.value)}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="portal"
                          disabled={busy === rule.id}
                          onClick={() => saveRule(rule.id)}
                        >
                          Salvar
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingId(rule.id);
                            setEditMultiplier(String(rule.multiplier));
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={busy === `del-${rule.id}`}
                          onClick={() => removeRule(rule.id)}
                        >
                          Excluir
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
