"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { scenarioCount } from "@/lib/assistant/scenarios";
import { ASSISTANT_TOOL_INVENTORY } from "@/lib/assistant/inventory";

type RuleEngineStats = {
  globalRules: number;
  nicheRules: number;
  tenantOverrides: number;
  totalTriggers: number;
  niche: string;
};

type SettingsResponse = {
  settings: {
    aiEnabled: boolean;
    rulesEnabled: boolean;
  };
  mode: "rules" | "ai";
  modeLabel: string;
  gatewayConfigured: boolean;
  inventory: {
    tools: number;
    scenarios: number;
  };
  rules?: RuleEngineStats;
};

export default function AssistenteConfigView() {
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interno/assistant/settings");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao carregar configurações");
        return;
      }
      setData(json as SettingsResponse);
    } catch {
      setError("Falha de conexão ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  async function patchSettings(patch: { aiEnabled?: boolean; rulesEnabled?: boolean }) {
    if (!data) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/interno/assistant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao salvar");
        return;
      }
      setData(json as SettingsResponse);
      if (patch.aiEnabled !== undefined) {
        setMessage(patch.aiEnabled ? "IA ativada para este tenant." : "IA desativada — modo regras operacionais.");
      } else if (patch.rulesEnabled !== undefined) {
        setMessage(
          patch.rulesEnabled
            ? "Motor de regras reativado."
            : "Motor de regras desativado — chat operacional indisponível (IA ainda funciona se ativa).",
        );
      }
    } catch {
      setError("Falha de conexão ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">Carregando configurações do assistente…</p>;
  }

  if (error && !data) {
    return <Alert tone="danger">{error}</Alert>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {error && <Alert tone="danger">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      <Card className="space-y-4 p-5">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Modo do assistente</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Modo efetivo: <strong>{data.modeLabel}</strong>
          </p>
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-[var(--border-muted)] p-4">
          <input
            type="checkbox"
            checked={data.settings.rulesEnabled}
            disabled={saving}
            onChange={(e) => void patchSettings({ rulesEnabled: e.target.checked })}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-medium text-[var(--text-primary)]">
              Motor de regras operacionais
            </span>
            <span className="block text-xs text-[var(--text-muted)]">
              Quando ativo, o chat usa gatilhos configuráveis por nicho. Desativar bloqueia o modo regras
              (IA continua disponível se o add-on estiver ligado).
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-[var(--border-muted)] p-4">
          <input
            type="checkbox"
            checked={data.settings.aiEnabled}
            disabled={saving || !data.gatewayConfigured}
            onChange={(e) => void patchSettings({ aiEnabled: e.target.checked })}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-medium text-[var(--text-primary)]">
              Chat com IA (add-on)
            </span>
            <span className="block text-xs text-[var(--text-muted)]">
              Quando ativo, o assistente usa o gateway configurado. Requer secrets no ambiente.
            </span>
            {!data.gatewayConfigured && (
              <span className="mt-1 block text-xs text-amber-700">
                Gateway não configurado neste ambiente — flag indisponível.
              </span>
            )}
          </span>
        </label>
      </Card>

      {data.rules && (
        <Card className="space-y-3 p-5">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Motor de regras (Fase 2)
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Nicho ativo: <strong>{data.rules.niche}</strong> — templates globais + vocabulário do segmento.
          </p>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--text-muted)]">Regras globais</dt>
              <dd className="font-medium">{data.rules.globalRules}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Com override de nicho</dt>
              <dd className="font-medium">{data.rules.nicheRules}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Gatilhos efetivos</dt>
              <dd className="font-medium">{data.rules.totalTriggers}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Overrides tenant</dt>
              <dd className="font-medium">{data.rules.tenantOverrides}</dd>
            </div>
          </dl>
          <p className="text-xs text-[var(--text-muted)]">
            Edição CRUD de regras por tenant — Fase 3.
          </p>
        </Card>
      )}

      <Card className="space-y-3 p-5">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Inventário (Fase 0)</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--text-muted)]">Tools mapeadas</dt>
            <dd className="font-medium">{ASSISTANT_TOOL_INVENTORY.length}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Cenários de rotina</dt>
            <dd className="font-medium">{scenarioCount()}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Portais</dt>
            <dd className="font-medium">Interno · Prestador · PJ · Beneficiário</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Nichos</dt>
            <dd className="font-medium">7 segmentos (templates + overrides)</dd>
          </div>
        </dl>
        <p className="text-xs text-[var(--text-muted)]">
          Documentação: <code>docs/produto/ASSISTENTE_REGRAS_PLANO.md</code>
        </p>
      </Card>

      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={saving} onClick={() => void load()}>
          Recarregar
        </Button>
      </div>
    </div>
  );
}
