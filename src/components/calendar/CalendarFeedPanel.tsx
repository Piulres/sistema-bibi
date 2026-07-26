"use client";

import { useCallback, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import SectionHeader from "@/components/ui/SectionHeader";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { fetchJson } from "@/lib/ui/api-feedback";
type Feed = {
  id: string;
  scope: string;
  label: string | null;
  active: boolean;
  url: string;
  subscribeHints: {
    google: string;
    outlook: string;
    apple: string;
  };
};

type Props = {
  /** `/api/prestador/calendar` ou `/api/interno/calendar` */
  apiPath: string;
  title?: string;
  description?: string;
};

/**
 * Painel para gerar URL de inscrição (Google / Outlook / Apple).
 * O calendário do usuário sincroniza sozinho ao consultar o feed ICS.
 */
export default function CalendarFeedPanel({
  apiPath,
  title = "Sincronizar com meu calendário",
  description = "Gere um link secreto e assine no Google Agenda, Outlook ou Apple Calendar. Novos agendamentos e cancelamentos passam a aparecer automaticamente.",
}: Props) {
  const { isBusy, run, showToast } = useAsyncAction();
  const [copied, setCopied] = useState(false);

  const load = useCallback(
    () => fetchJson<{ feed?: Feed | null }>(apiPath, undefined, "Erro ao carregar calendário"),
    [apiPath],
  );

  const { data, loading, error, reload } = useAsyncData(load, [apiPath]);
  const feed = data?.feed ?? null;

  async function createOrEnsure(rotate = false) {
    await run(
      rotate ? "rotate" : "create",
      () =>
        fetch(apiPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rotate }),
        }),
      {
        silentSuccess: true,
        errorMessage: rotate ? "Erro ao rotacionar link" : "Erro ao gerar link",
        confirm: rotate
          ? {
              title: "Gerar novo link?",
              message:
                "O link atual deixa de funcionar. Atualize a inscrição no Google/Outlook/Apple com o novo endereço.",
              confirmLabel: "Gerar novo link",
              tone: "danger" as const,
            }
          : undefined,
        onSuccess: async () => {
          showToast({
            message: rotate ? "Novo link gerado" : "Link de calendário pronto",
            tone: "success",
          });
          await reload();
        },
      },
    );
  }

  async function revoke() {
    await run(
      "revoke",
      () => fetch(apiPath, { method: "DELETE" }),
      {
        confirm: {
          title: "Revogar link?",
          message:
            "Inscrições existentes param de atualizar até você gerar um novo link.",
          confirmLabel: "Revogar",
          cancelLabel: "Cancelar",
          tone: "danger" as const,
        },
        successMessage: "Link revogado",
        onSuccess: () => {
          void reload();
        },
      },
    );
  }

  async function copyUrl() {
    if (!feed?.url) return;
    try {
      await navigator.clipboard.writeText(feed.url);
      setCopied(true);
      showToast({ message: "Link copiado", tone: "success" });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast({ message: "Não foi possível copiar", tone: "danger" });
    }
  }

  return (
    <ViewStateBoundary
      loading={loading}
      error={error}
      loadingMessage="Carregando sincronização de calendário..."
      onRetry={() => void reload()}
    >
      <Card>
        <SectionHeader title={title} description={description} />
        <div className="mt-4 space-y-4">
          {!feed ? (
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-muted)]">
                Ainda não há um link de inscrição. Gere um para conectar a agenda a
                Google, Microsoft ou Apple.
              </p>
              <Button
                type="button"
                variant="portal"
                disabled={isBusy("create")}
                onClick={() => void createOrEnsure(false)}
              >
                {isBusy("create") ? "Gerando…" : "Gerar link de inscrição"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm">
                <span className="text-[var(--text-secondary)]">URL do feed (secreta)</span>
                <input
                  readOnly
                  className="mt-1 w-full rounded-[var(--radius-button)] border border-[var(--border-muted)] bg-[var(--surface-muted)] px-3 py-2 font-mono text-xs text-[var(--text-primary)]"
                  value={feed.url}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="portal"
                  size="sm"
                  onClick={() => void copyUrl()}
                >
                  {copied ? "Copiado" : "Copiar link"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isBusy("rotate")}
                  onClick={() => void createOrEnsure(true)}
                >
                  Rotacionar link
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isBusy("revoke")}
                  onClick={() => void revoke()}
                >
                  Revogar
                </Button>
              </div>
              <ul className="space-y-1 text-xs text-[var(--text-muted)]">
                <li>· {feed.subscribeHints.google}</li>
                <li>· {feed.subscribeHints.outlook}</li>
                <li>· {feed.subscribeHints.apple}</li>
              </ul>
            </div>
          )}
        </div>
      </Card>
    </ViewStateBoundary>
  );
}
