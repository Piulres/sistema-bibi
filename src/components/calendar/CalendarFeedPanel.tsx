"use client";

import { useCallback, useEffect, useState } from "react";
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

type Connection = {
  id: string;
  provider: "GOOGLE" | "MICROSOFT";
  accountEmail: string | null;
  status: string;
  lastSyncedAt: string | null;
  lastError: string | null;
};

type ProviderStatus = {
  id: "GOOGLE" | "MICROSOFT";
  label: string;
  configured: boolean;
  mock: boolean;
};

type CalendarPayload = {
  feed?: Feed | null;
  connections?: Connection[];
  providers?: ProviderStatus[];
  oauth?: {
    googleStart: string;
    microsoftStart: string;
  };
};

type Props = {
  /** `/api/prestador/calendar` ou `/api/interno/calendar` */
  apiPath: string;
  /** Base para DELETE de conexão OAuth */
  connectionsApiPath: string;
  title?: string;
  description?: string;
};

/**
 * Painel principal: conectar Google/Microsoft (push OAuth) + feed ICS (Apple / fallback).
 */
export default function CalendarFeedPanel({
  apiPath,
  connectionsApiPath,
  title = "Calendário externo",
  description = "Conecte Google Agenda ou Microsoft Outlook: novos agendamentos, remarcações e cancelamentos são enviados automaticamente. Apple e outros podem usar o feed ICS.",
}: Props) {
  const { isBusy, run, showToast } = useAsyncAction();
  const [copied, setCopied] = useState(false);
  const [showIcs, setShowIcs] = useState(false);

  const load = useCallback(
    () => fetchJson<CalendarPayload>(apiPath, undefined, "Erro ao carregar calendário"),
    [apiPath],
  );

  const { data, loading, error, reload } = useAsyncData(load, [apiPath]);
  const feed = data?.feed ?? null;
  const connections = data?.connections ?? [];
  const providers = data?.providers ?? [];
  const oauth = data?.oauth;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("calendarConnected");
    const calendarError = params.get("calendarError");
    if (connected) {
      showToast({
        message: `Calendário conectado (${connected})`,
        tone: "success",
      });
      params.delete("calendarConnected");
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", next);
      void reload();
    }
    if (calendarError) {
      showToast({
        message: `Falha ao conectar calendário: ${calendarError}`,
        tone: "danger",
      });
      params.delete("calendarError");
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", next);
    }
    // toast/reload estáveis o suficiente para o handoff OAuth na montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handoff one-shot na URL
  }, []);

  function providerMeta(id: "GOOGLE" | "MICROSOFT") {
    return providers.find((p) => p.id === id);
  }

  function connectionFor(id: "GOOGLE" | "MICROSOFT") {
    return connections.find((c) => c.provider === id && c.status !== "REVOKED");
  }

  async function disconnect(provider: "GOOGLE" | "MICROSOFT") {
    await run(
      `disc-${provider}`,
      () => fetch(`${connectionsApiPath}/${provider.toLowerCase()}`, { method: "DELETE" }),
      {
        confirm: {
          title: "Desconectar calendário?",
          message: "Novos agendamentos deixam de ser enviados a este calendário.",
          confirmLabel: "Desconectar",
          cancelLabel: "Cancelar",
          tone: "danger" as const,
        },
        successMessage: "Calendário desconectado",
        onSuccess: () => {
          void reload();
        },
      },
    );
  }

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
                "O link atual deixa de funcionar. Atualize a inscrição no Apple/Google com o novo endereço.",
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

  async function revokeFeed() {
    await run(
      "revoke",
      () => fetch(apiPath, { method: "DELETE" }),
      {
        confirm: {
          title: "Revogar link ICS?",
          message:
            "Inscrições por URL param de atualizar até você gerar um novo link.",
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

  function renderConnectRow(id: "GOOGLE" | "MICROSOFT", startHref: string | undefined) {
    const meta = providerMeta(id);
    const conn = connectionFor(id);
    const label = meta?.label ?? (id === "GOOGLE" ? "Google Agenda" : "Microsoft Outlook");
    const ready = Boolean(meta?.configured || meta?.mock);

    return (
      <div className="flex flex-col gap-2 rounded-[var(--radius-button)] border border-[var(--border-muted)] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-[var(--text-primary)]">{label}</p>
          {conn ? (
            <p className="text-xs text-[var(--text-muted)]">
              Conectado{conn.accountEmail ? ` · ${conn.accountEmail}` : ""}
              {conn.status === "ERROR" ? ` · erro: ${conn.lastError ?? "reconecte"}` : ""}
              {conn.lastSyncedAt
                ? ` · sync ${new Date(conn.lastSyncedAt).toLocaleString("pt-BR")}`
                : ""}
            </p>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">
              {ready
                ? "Push automático de criar, remarcar e cancelar"
                : "Configure CLIENT_ID/SECRET no ambiente (ver documentação)"}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {conn ? (
            <>
              {startHref && ready ? (
                <a href={startHref} className="ds-touch-link">
                  Reconectar
                </a>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isBusy(`disc-${id}`)}
                onClick={() => void disconnect(id)}
              >
                Desconectar
              </Button>
            </>
          ) : startHref && ready ? (
            <a href={startHref} className="ds-touch-link ds-touch-link-solid">
              Conectar
            </a>
          ) : (
            <Button type="button" variant="secondary" size="sm" disabled>
              Indisponível
            </Button>
          )}
        </div>
      </div>
    );
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
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Conexão direta (recomendado)
            </p>
            {renderConnectRow("GOOGLE", oauth?.googleStart)}
            {renderConnectRow("MICROSOFT", oauth?.microsoftStart)}
          </div>

          <div className="border-t border-[var(--border-muted)] pt-4">
            <button
              type="button"
              className="text-sm font-medium text-[var(--portal-accent)] underline"
              onClick={() => setShowIcs((v) => !v)}
            >
              {showIcs ? "Ocultar feed ICS (Apple e outros)" : "Feed ICS (Apple e inscrição por URL)"}
            </button>
            {showIcs ? (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-[var(--text-muted)]">
                  Alternativa sem OAuth: gere um link secreto e assine no Apple Calendar,
                  Google ou Outlook via URL.
                </p>
                {!feed ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isBusy("create")}
                    onClick={() => void createOrEnsure(false)}
                  >
                    {isBusy("create") ? "Gerando…" : "Gerar link de inscrição"}
                  </Button>
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
                      <Button type="button" variant="portal" size="sm" onClick={() => void copyUrl()}>
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
                        onClick={() => void revokeFeed()}
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
            ) : null}
          </div>
        </div>
      </Card>
    </ViewStateBoundary>
  );
}
