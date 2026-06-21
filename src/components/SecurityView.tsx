"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";
import SectionHeader from "@/components/ui/SectionHeader";
import Input from "@/components/ui/Input";

export default function SecurityView() {
  const [loading, setLoading] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/auth/mfa/setup");
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Erro ao carregar");
    else setMfaEnabled(Boolean(data.mfaEnabled));
    setLoading(false);
  }, []);

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

  async function startSetup() {
    setBusy("setup");
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/mfa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Erro");
      else setSetup({ secret: data.secret, otpauthUrl: data.otpauthUrl });
    } finally {
      setBusy(null);
    }
  }

  async function enableMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!setup) return;
    setBusy("enable");
    setError(null);
    try {
      const res = await fetch("/api/auth/mfa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable", secret: setup.secret, code }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Erro");
      else {
        setMsg(data.message ?? "MFA ativado");
        setMfaEnabled(true);
        setSetup(null);
        setCode("");
      }
    } finally {
      setBusy(null);
    }
  }

  async function disableMfa(e: React.FormEvent) {
    e.preventDefault();
    setBusy("disable");
    setError(null);
    try {
      const res = await fetch("/api/auth/mfa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable", code: disableCode }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Erro");
      else {
        setMsg(data.message ?? "MFA desativado");
        setMfaEnabled(false);
        setDisableCode("");
      }
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <LoadingState message="Carregando segurança..." />;

  return (
    <div className="space-y-6">
      {msg && <Alert tone="success">{msg}</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}

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
          <Button className="mt-4" variant="portal" disabled={busy === "setup"} onClick={startSetup}>
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
            <Button type="submit" variant="portal" disabled={busy === "enable"}>
              {busy === "enable" ? "Ativando..." : "Ativar MFA"}
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
            <Button type="submit" variant="secondary" disabled={busy === "disable"}>
              Desativar MFA
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
