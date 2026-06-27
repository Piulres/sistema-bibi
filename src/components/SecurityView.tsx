"use client";

import { useCallback, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ViewStateBoundary from "@/components/ui/ViewStateBoundary";
import SectionHeader from "@/components/ui/SectionHeader";
import Input from "@/components/ui/Input";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { fetchJson } from "@/lib/ui/api-feedback";
import { confirmPresets } from "@/lib/ui/confirm-presets";

export default function SecurityView() {
  const { isBusy, run, showToast } = useAsyncAction();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");

  const loadMfa = useCallback(async () => {
    const result = await fetchJson<{ mfaEnabled?: boolean }>(
      "/api/auth/mfa/setup",
      undefined,
      "Erro ao carregar MFA",
    );
    if (result.ok) {
      setMfaEnabled(Boolean(result.data.mfaEnabled));
    }
    return result;
  }, []);

  const { loading, error, reload } = useAsyncData(loadMfa, [], {
    forbiddenMessage: "Sem permissão para acessar configurações de segurança",
  });

  async function startSetup() {
    await run(
      "setup",
      () =>
        fetch("/api/auth/mfa/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "setup" }),
        }),
      {
        silentSuccess: true,
        onSuccess: (body) => {
          setSetup({
            secret: String(body.secret ?? ""),
            otpauthUrl: String(body.otpauthUrl ?? ""),
          });
        },
      },
    );
  }

  async function enableMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!setup) return;
    await run(
      "enable",
      () =>
        fetch("/api/auth/mfa/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "enable", secret: setup.secret, code }),
        }),
      {
        silentSuccess: true,
        onSuccess: (body) => {
          setMfaEnabled(true);
          setSetup(null);
          setCode("");
          showToast({ message: String(body.message ?? "MFA ativado"), tone: "success" });
        },
      },
    );
  }

  async function disableMfa(e: React.FormEvent) {
    e.preventDefault();
    await run(
      "disable",
      () =>
        fetch("/api/auth/mfa/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "disable", code: disableCode }),
        }),
      {
        confirm: confirmPresets.disableMfa(),
        silentSuccess: true,
        onSuccess: (body) => {
          setMfaEnabled(false);
          setDisableCode("");
          showToast({ message: String(body.message ?? "MFA desativado"), tone: "success" });
        },
      },
    );
  }

  return (
    <ViewStateBoundary
      loading={loading}
      error={error}
      loadingMessage="Carregando segurança..."
      onRetry={() => void reload()}
    >
      <div className="space-y-6">
        <Card>
          <SectionHeader
            title="Autenticação em dois fatores (MFA)"
            description="TOTP compatível com Google Authenticator, Authy ou similar. POC Tier 4."
          />
          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            Status:{" "}
            {mfaEnabled ? (
              <span className="font-semibold text-emerald-600">Ativo</span>
            ) : (
              <span className="font-semibold text-[var(--text-muted)]">Inativo</span>
            )}
          </p>

          {!mfaEnabled && !setup && (
            <Button className="mt-4" variant="portal" disabled={isBusy("setup")} onClick={startSetup}>
              Configurar MFA
            </Button>
          )}

          {setup && !mfaEnabled && (
            <form onSubmit={enableMfa} className="mt-6 space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Adicione esta chave no app autenticador ou use a URL otpauth:
              </p>
              <code className="block break-all rounded bg-[var(--surface-muted)] p-3 text-xs">
                {setup.secret}
              </code>
              <p className="break-all text-xs text-[var(--text-muted)]">{setup.otpauthUrl}</p>
              <Input
                label="Código de 6 dígitos"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                inputMode="numeric"
              />
              <Button type="submit" variant="portal" disabled={isBusy("enable")}>
                {isBusy("enable") ? "Ativando..." : "Ativar MFA"}
              </Button>
            </form>
          )}

          {mfaEnabled && (
            <form onSubmit={disableMfa} className="mt-6 space-y-4">
              <Input
                label="Código atual para desativar"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                inputMode="numeric"
              />
              <Button type="submit" variant="secondary" disabled={isBusy("disable")}>
                Desativar MFA
              </Button>
            </form>
          )}
        </Card>
      </div>
    </ViewStateBoundary>
  );
}
