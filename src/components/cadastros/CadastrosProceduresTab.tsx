"use client";

import { useCallback, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import SectionHeader from "@/components/ui/SectionHeader";
import ImportInterchangePanel from "@/components/cadastros/ImportInterchangePanel";
import { CADASTROS_FIELD_CLASS, type ProcedureRow } from "@/components/cadastros/types";
import { useLabels } from "@/hooks/useLabels";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { fetchJson } from "@/lib/ui/api-feedback";
import { confirmPresets } from "@/lib/ui/confirm-presets";

type ProceduresPayload = {
  procedures: ProcedureRow[];
};

export default function CadastrosProceduresTab() {
  const { labels } = useLabels();
  const { isBusy, run, showToast } = useAsyncAction();
  const fieldClass = CADASTROS_FIELD_CLASS;

  const [procForm, setProcForm] = useState({
    code: "",
    name: "",
    category: "CONSULTA",
    basePrice: "150",
  });
  const [editingProcedure, setEditingProcedure] = useState<ProcedureRow | null>(null);

  const loadProcedures = useCallback(async () => {
    const prRes = await fetchJson<{ procedures?: ProcedureRow[] }>(
      "/api/interno/procedures",
      undefined,
      "Erro ao carregar procedimentos",
    );
    if (!prRes.ok) return prRes;
    return {
      ok: true as const,
      data: { procedures: prRes.data.procedures ?? [] },
      status: 200,
    };
  }, []);

  const { data, loading, error, reload } = useAsyncData<ProceduresPayload>(loadProcedures, [], {
    forbiddenMessage: "Sem permissão para acessar cadastros",
  });

  const procedures = data?.procedures ?? [];

  async function submitProcedure(e: React.FormEvent) {
    e.preventDefault();
    await run(
      "procedure",
      () =>
        fetch("/api/interno/procedures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...procForm,
            basePrice: Number(procForm.basePrice),
          }),
        }),
      {
        silentSuccess: true,
        onSuccess: async (body) => {
          const procedure = body.procedure as { code: string };
          showToast({ message: `Procedimento ${procedure.code} cadastrado`, tone: "success" });
          setProcForm({ code: "", name: "", category: "CONSULTA", basePrice: "150" });
          await reload();
        },
      },
    );
  }

  async function saveProcedureEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProcedure) return;
    const procId = editingProcedure.id;
    await run(
      `edit-proc-${procId}`,
      () =>
        fetch(`/api/interno/procedures/${procId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: editingProcedure.code,
            name: editingProcedure.name,
            category: editingProcedure.category,
            basePrice: editingProcedure.basePrice,
          }),
        }),
      {
        silentSuccess: true,
        onSuccess: async (body) => {
          const procedure = body.procedure as { code: string };
          showToast({ message: `Procedimento ${procedure.code} atualizado`, tone: "success" });
          setEditingProcedure(null);
          await reload();
        },
      },
    );
  }

  async function deleteProcedure(id: string, label: string) {
    await run(
      `del-${id}`,
      () => fetch(`/api/interno/procedures/${id}`, { method: "DELETE" }),
      {
        confirm: confirmPresets.delete(label),
        successMessage: "Procedimento excluído",
        onSuccess: async () => {
          await reload();
        },
      },
    );
  }

  return (
    <ViewStateBoundary
      loading={loading}
      error={error}
      loadingMessage={`Carregando ${labels.procedures.toLowerCase()}...`}
      onRetry={() => void reload()}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ImportInterchangePanel
          entity="procedures"
          entityLabel={labels.procedure}
          onImported={() => void reload()}
        />
        <Card>
          <SectionHeader title="Novo procedimento" />
          <form onSubmit={submitProcedure} className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Código</span>
              <input
                required
                className={fieldClass}
                value={procForm.code}
                onChange={(e) => setProcForm({ ...procForm, code: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Nome</span>
              <input
                required
                className={fieldClass}
                value={procForm.name}
                onChange={(e) => setProcForm({ ...procForm, name: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Categoria</span>
              <select
                className={fieldClass}
                value={procForm.category}
                onChange={(e) => setProcForm({ ...procForm, category: e.target.value })}
              >
                <option value="CONSULTA">Consulta</option>
                <option value="EXAME">Exame</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-[var(--text-secondary)]">Preço (R$)</span>
              <input
                required
                type="number"
                step="0.01"
                className={fieldClass}
                value={procForm.basePrice}
                onChange={(e) => setProcForm({ ...procForm, basePrice: e.target.value })}
              />
            </label>
            <Button type="submit" variant="portal" disabled={isBusy("procedure")}>
              Cadastrar
            </Button>
          </form>
        </Card>
        <Card>
          <SectionHeader title="Catálogo" />
          <ul className="mt-4 divide-y divide-[var(--border-default)]">
            {procedures.map((p) => (
              <li key={p.id} className="py-3 text-sm">
                {editingProcedure?.id === p.id ? (
                  <form onSubmit={saveProcedureEdit} className="space-y-2 rounded border border-[var(--border-muted)] p-3">
                    <input
                      required
                      className={fieldClass}
                      value={editingProcedure.code}
                      onChange={(e) =>
                        setEditingProcedure({ ...editingProcedure, code: e.target.value })
                      }
                    />
                    <input
                      required
                      className={fieldClass}
                      value={editingProcedure.name}
                      onChange={(e) =>
                        setEditingProcedure({ ...editingProcedure, name: e.target.value })
                      }
                    />
                    <select
                      className={fieldClass}
                      value={editingProcedure.category}
                      onChange={(e) =>
                        setEditingProcedure({ ...editingProcedure, category: e.target.value })
                      }
                    >
                      <option value="CONSULTA">Consulta</option>
                      <option value="EXAME">Exame</option>
                    </select>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className={fieldClass}
                      value={editingProcedure.basePrice}
                      onChange={(e) =>
                        setEditingProcedure({
                          ...editingProcedure,
                          basePrice: Number(e.target.value),
                        })
                      }
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" variant="portal" disabled={isBusy(`edit-proc-${p.id}`)}>
                        Salvar
                      </Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => setEditingProcedure(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-between gap-2">
                    <span>
                      {p.code} — {p.name} ({p.basePriceLabel})
                    </span>
                    <div className="flex gap-1">
                      <Button type="button" size="sm" variant="ghost" onClick={() => setEditingProcedure({ ...p })}>
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isBusy(`del-${p.id}`)}
                        onClick={() => deleteProcedure(p.id, `${p.code} — ${p.name}`)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </ViewStateBoundary>
  );
}
