"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { scenarioCount } from "@/lib/assistant/scenarios";
import { ASSISTANT_TOOL_INVENTORY } from "@/lib/assistant/inventory";

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

  async function toggleAi(enabled: boolean) {
    if (!data) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/interno/assistant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiEnabled: enabled }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao salvar");
        return;
      }
      setData(json as SettingsResponse);
      setMessage(enabled ? "IA ativada para este tenant." : "IA desativada — modo regras operacionais.");
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
            checked={data.settings.aiEnabled}
            disabled={saving || !data.gatewayConfigured}
            onChange={(e) => void toggleAi(e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-medium text-[var(--text-primary)]">
              Chat com IA (add-on)
            </span>
            <span className="block text-xs text-[var(--text-muted)]">
              Quando ativo, o assistente usa o gateway configurado e passa pelo motor de regras
              existente na tomada de decisão. Requer secrets no ambiente.
            </span>
            {!data.gatewayConfigured && (
              <span className="mt-1 block text-xs text-amber-700">
                Gateway não configurado neste ambiente — flag indisponível.
              </span>
            )}
          </span>
        </label>

        <p className="text-xs text-[var(--text-muted)]">
          Motor de regras: {data.settings.rulesEnabled ? "ativo" : "desativado"} (padrão: ativo).
          Painel de edição de regras por nicho — Fase 2.
        </p>
      </Card>

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
