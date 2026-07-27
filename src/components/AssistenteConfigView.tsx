"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type TenantRuleOverride = {
  tool: string;
  addTriggers?: string[];
  removeTriggers?: string[];
  disabled?: boolean;
};

type RulePreviewRow = {
  tool: string;
  triggers: string[];
  source: "global" | "niche" | "tenant";
  disabled: boolean;
  addTriggers: string[];
  removeTriggers: string[];
};

type SettingsResponse = {
  settings: {
    aiEnabled: boolean;
    rulesEnabled: boolean;
    ruleOverrides?: TenantRuleOverride[];
  };
  mode: "rules" | "ai";
  modeLabel: string;
  gatewayConfigured: boolean;
  inventory: {
    tools: number;
    scenarios: number;
  };
  rules?: RuleEngineStats;
  ruleOverrides?: TenantRuleOverride[];
  previewRules?: RulePreviewRow[];
};

function triggersToText(list?: string[]): string {
  return (list ?? []).join("\n");
}

function textToTriggers(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

const SOURCE_LABEL: Record<RulePreviewRow["source"], string> = {
  global: "Global",
  niche: "Nicho",
  tenant: "Tenant",
};

export default function AssistenteConfigView() {
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [draftOverrides, setDraftOverrides] = useState<TenantRuleOverride[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [filter, setFilter] = useState("");

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
      const payload = json as SettingsResponse;
      setData(payload);
      setDraftOverrides(payload.ruleOverrides ?? []);
      setSelectedTool((current) => current || payload.previewRules?.[0]?.tool || "");
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

  const toolOptions = useMemo(() => {
    const fromPreview = (data?.previewRules ?? []).map((r) => r.tool);
    const fromInventory = ASSISTANT_TOOL_INVENTORY.map((t) => t.name);
    return [...new Set([...fromPreview, ...fromInventory])].sort((a, b) => a.localeCompare(b));
  }, [data?.previewRules]);

  const filteredPreview = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const rows = data?.previewRules ?? [];
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.tool.toLowerCase().includes(q) ||
        r.triggers.some((t) => t.toLowerCase().includes(q)),
    );
  }, [data?.previewRules, filter]);

  const selectedOverride = draftOverrides.find((o) => o.tool === selectedTool);
  const selectedPreview = data?.previewRules?.find((r) => r.tool === selectedTool);

  function upsertOverride(next: TenantRuleOverride) {
    setDraftOverrides((prev) => {
      const others = prev.filter((o) => o.tool !== next.tool);
      const hasEffect =
        next.disabled === true ||
        (next.addTriggers?.length ?? 0) > 0 ||
        (next.removeTriggers?.length ?? 0) > 0;
      return hasEffect ? [...others, next].sort((a, b) => a.tool.localeCompare(b.tool)) : others;
    });
  }

  function removeOverride(tool: string) {
    setDraftOverrides((prev) => prev.filter((o) => o.tool !== tool));
  }

  async function patchSettings(patch: {
    aiEnabled?: boolean;
    rulesEnabled?: boolean;
    ruleOverrides?: TenantRuleOverride[];
  }) {
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
      const payload = json as SettingsResponse;
      setData(payload);
      if (patch.ruleOverrides !== undefined) {
        setDraftOverrides(payload.ruleOverrides ?? []);
        setMessage("Overrides de regras salvos para este tenant.");
      } else if (patch.aiEnabled !== undefined) {
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
              Quando ativo, o assistente usa o gateway (LLM → validação pelas regras → tools).
              Requer secrets no ambiente.
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
            Motor de regras
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Nicho ativo: <strong>{data.rules.niche}</strong> — templates globais + vocabulário do segmento +
            overrides do tenant.
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
        </Card>
      )}

      <Card className="space-y-4 p-5">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Regras do tenant (Fase 3)
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Adicione gatilhos, remova frases do template ou desative uma tool só neste realm. Preview
            reflete o motor efetivo após salvar.
          </p>
        </div>

        <label className="block text-sm sm:max-w-md">
          <span className="mb-1 block text-[var(--text-muted)]">Tool</span>
          <select
            className="w-full rounded-md border border-[var(--border-muted)] bg-[var(--surface)] px-3 py-2"
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            aria-label="Selecionar tool da regra"
          >
            <option value="">Selecione…</option>
            {toolOptions.map((tool) => (
              <option key={tool} value={tool}>
                {tool}
              </option>
            ))}
          </select>
        </label>

        {selectedTool && (
          <div className="space-y-3 rounded-lg border border-[var(--border-muted)] p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={selectedOverride?.disabled === true}
                disabled={saving}
                onChange={(e) =>
                  upsertOverride({
                    tool: selectedTool,
                    addTriggers: selectedOverride?.addTriggers,
                    removeTriggers: selectedOverride?.removeTriggers,
                    disabled: e.target.checked || undefined,
                  })
                }
              />
              <span className="text-sm">
                <span className="font-medium text-[var(--text-primary)]">Desativar tool neste tenant</span>
                <span className="block text-xs text-[var(--text-muted)]">
                  Remove a tool do motor de regras para este realm.
                </span>
              </span>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-[var(--text-muted)]">Adicionar gatilhos (um por linha)</span>
              <textarea
                className="min-h-20 w-full rounded-md border border-[var(--border-muted)] bg-[var(--surface)] px-3 py-2 font-mono text-xs"
                value={triggersToText(selectedOverride?.addTriggers)}
                disabled={saving || selectedOverride?.disabled === true}
                onChange={(e) =>
                  upsertOverride({
                    tool: selectedTool,
                    addTriggers: textToTriggers(e.target.value),
                    removeTriggers: selectedOverride?.removeTriggers,
                    disabled: selectedOverride?.disabled,
                  })
                }
                aria-label={`Gatilhos adicionais para ${selectedTool}`}
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-[var(--text-muted)]">Remover gatilhos do template</span>
              <textarea
                className="min-h-20 w-full rounded-md border border-[var(--border-muted)] bg-[var(--surface)] px-3 py-2 font-mono text-xs"
                value={triggersToText(selectedOverride?.removeTriggers)}
                disabled={saving || selectedOverride?.disabled === true}
                onChange={(e) =>
                  upsertOverride({
                    tool: selectedTool,
                    addTriggers: selectedOverride?.addTriggers,
                    removeTriggers: textToTriggers(e.target.value),
                    disabled: selectedOverride?.disabled,
                  })
                }
                aria-label={`Gatilhos a remover de ${selectedTool}`}
              />
            </label>

            {selectedPreview && (
              <div className="rounded-md bg-[var(--surface-muted,transparent)] text-xs text-[var(--text-muted)]">
                <p>
                  Preview salvo: <strong>{SOURCE_LABEL[selectedPreview.source]}</strong>
                  {selectedPreview.disabled ? " · desativada" : ""} ·{" "}
                  {selectedPreview.triggers.length} gatilho(s)
                </p>
                <p className="mt-1 line-clamp-3 font-mono">
                  {selectedPreview.triggers.slice(0, 8).join(" · ") || "—"}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">
            Overrides no rascunho ({draftOverrides.length})
          </h3>
          {draftOverrides.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Nenhum override — tenant usa só global + nicho.</p>
          ) : (
            <ul className="divide-y divide-[var(--border-muted)] rounded-lg border border-[var(--border-muted)]">
              {draftOverrides.map((o) => (
                <li key={o.tool} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                  <button
                    type="button"
                    className="text-left font-medium text-[var(--text-primary)] underline-offset-2 hover:underline"
                    onClick={() => setSelectedTool(o.tool)}
                  >
                    {o.tool}
                  </button>
                  <span className="text-xs text-[var(--text-muted)]">
                    {o.disabled
                      ? "desativada"
                      : `+${o.addTriggers?.length ?? 0} / −${o.removeTriggers?.length ?? 0}`}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={saving}
                    onClick={() => removeOverride(o.tool)}
                  >
                    Remover
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={saving}
            onClick={() => void patchSettings({ ruleOverrides: draftOverrides })}
          >
            Salvar overrides
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={saving}
            onClick={() => setDraftOverrides(data.ruleOverrides ?? [])}
          >
            Descartar rascunho
          </Button>
        </div>
      </Card>

      <Card className="space-y-3 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Preview efetivo</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Tools e gatilhos após merge global → nicho → tenant.
            </p>
          </div>
          <label className="block text-sm">
            <span className="sr-only">Filtrar preview</span>
            <input
              type="search"
              placeholder="Filtrar tool ou gatilho…"
              className="w-56 rounded-md border border-[var(--border-muted)] bg-[var(--surface)] px-3 py-2 text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </label>
        </div>
        <div className="max-h-80 overflow-auto rounded-lg border border-[var(--border-muted)]">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[var(--surface)] text-[var(--text-muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">Tool</th>
                <th className="px-3 py-2 font-medium">Origem</th>
                <th className="px-3 py-2 font-medium">Gatilhos</th>
              </tr>
            </thead>
            <tbody>
              {filteredPreview.map((row) => (
                <tr
                  key={row.tool}
                  className="cursor-pointer border-t border-[var(--border-muted)] hover:bg-[var(--surface-muted,transparent)]"
                  onClick={() => setSelectedTool(row.tool)}
                >
                  <td className="px-3 py-2 font-medium text-[var(--text-primary)]">
                    {row.tool}
                    {row.disabled ? (
                      <span className="ml-2 text-amber-700">(off)</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">{SOURCE_LABEL[row.source]}</td>
                  <td className="px-3 py-2 font-mono text-[var(--text-muted)]">
                    {row.triggers.slice(0, 4).join(" · ")}
                    {row.triggers.length > 4 ? ` · +${row.triggers.length - 4}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
