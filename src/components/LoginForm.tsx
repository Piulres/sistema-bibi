"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { BrandingTokens } from "@/lib/theme/tokens";
import type { PortalKey } from "@/lib/roles";
import { PORTAL_THEMES } from "@/lib/theme/portals";
import TenantTheme from "@/components/layout/TenantTheme";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

type Props = {
  portal: PortalKey;
  title: string;
  subtitle: string;
  demoEmail: string;
  demoPassword: string;
  branding: BrandingTokens;
};

export default function LoginForm({
  portal,
  title,
  subtitle,
  demoEmail,
  demoPassword,
  branding,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState(demoEmail);
  const [password, setPassword] = useState(demoPassword);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const portalTheme = PORTAL_THEMES[portal];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, portal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falha no login");
        return;
      }
      if (data.mfaRequired && data.mfaToken) {
        setMfaToken(data.mfaToken);
        return;
      }
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  async function handleMfaSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaToken) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfaToken, code: mfaCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Código inválido");
        return;
      }
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <TenantTheme branding={branding} portal={portal} className="flex flex-1 flex-col">
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="text-sm text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
          >
            ← Voltar
          </Link>
          <Card padding="lg" className="mt-4">
            <div className="flex items-center gap-3">
              {branding.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={branding.logoUrl}
                  alt=""
                  className="h-10 w-10 rounded-lg object-contain"
                />
              ) : (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-[var(--text-inverse)] ds-gradient-portal"
                  aria-hidden
                >
                  {branding.displayName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  {branding.displayName}
                </p>
                <div className="mt-1 h-1 w-12 rounded-full ds-gradient-portal" />
              </div>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>

            {!mfaToken ? (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <Input
                  label="E-mail"
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Senha"
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {error && <Alert tone="danger">{error}</Alert>}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleMfaSubmit} className="mt-6 space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Informe o código de 6 dígitos do seu autenticador.
                </p>
                <Input
                  label="Código MFA"
                  id="mfaCode"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  required
                />
                {error && <Alert tone="danger">{error}</Alert>}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Verificando..." : "Confirmar código"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setMfaToken(null);
                    setMfaCode("");
                    setError(null);
                  }}
                >
                  Voltar
                </Button>
              </form>
            )}

            {!mfaToken && (
              <p className="mt-4 rounded-[var(--radius-button)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text-muted)]">
                Demo: <span className="font-mono">{demoEmail}</span> / senha{" "}
                <span className="font-mono">{demoPassword}</span>
              </p>
            )}
            <p className="mt-2 text-center text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
              {portalTheme.label} · {branding.platformLabel}
            </p>
          </Card>
        </div>
      </main>
    </TenantTheme>
  );
}
