"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import SectionHeader from "@/components/ui/SectionHeader";
import Input from "@/components/ui/Input";

type DataStoreStatus = {
  mode: "demo" | "operation";
  dualStoreEnabled: boolean;
  persistence: "netlify-blobs" | "local-file" | "env-only";
  demoResetAvailable: boolean;
  canSwitch: boolean;
};

type Props = {
  isAdmin: boolean;
};

export default function DataStoreCard({ isAdmin }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<DataStoreStatus | null>(null);
  const [targetMode, setTargetMode] = useState<"demo" | "operation">("operation");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/interno/data-store");
    if (res.ok) {
      setStatus(await res.json());
    }
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

  async function handleSwitch(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/interno/data-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: targetMode, confirm: confirm.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao alternar modo de dados");
        return;
      }
      setSuccess(data.message ?? "Modo alterado");
      setConfirm("");
      await load();
      if (data.logoutRecommended) {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/interno/login");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin || !status?.canSwitch) {
    return null;
  }

  const isDemo = status.mode === "demo";
  const expectedConfirm = targetMode === "operation" ? "OPERAR" : "DEMO";

  return (
    <Card className="border-teal-200 bg-teal-50/40">
      <SectionHeader
        title="Base de dados — demo ou operação"
        description="Alterna entre a massa de teste (apresentações) e o banco real da clínica. A escolha vale para todo o site — todos os portais usam a mesma base."
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            isDemo ? "bg-amber-100 text-amber-900" : "bg-teal-100 text-teal-900"
          }`}
        >
          Ativo: {isDemo ? "Demo (teste)" : "Operação (real)"}
        </span>
        <span className="text-sm text-[var(--text-secondary)]">
          Persistência:{" "}
          {status.persistence === "netlify-blobs"
            ? "Netlify Blobs"
            : status.persistence === "local-file"
              ? "Arquivo local"
              : "Variável de ambiente"}
        </span>
      </div>

      {error && (
        <Alert tone="danger" className="mt-4">
          {error}
        </Alert>
      )}
      {success && (
        <Alert tone="success" className="mt-4">
          {success}
        </Alert>
      )}

      <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-[var(--text-secondary)]">
        <li>
          <strong>Demo</strong> — 50 empresas, beneficiários e fluxos de apresentação (somente leitura
          do build; reset disponível abaixo)
        </li>
        <li>
          <strong>Operação</strong> — banco vazio com usuários essenciais; cadastros e faturamento
          persistem em Netlify Blobs (sem Postgres)
        </li>
        <li>A troca afeta todos os portais simultaneamente — faça login novamente após alternar</li>
      </ul>

      <form onSubmit={handleSwitch} className="mt-6 space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant={targetMode === "operation" ? "primary" : "secondary"}
            onClick={() => {
              setTargetMode("operation");
              setConfirm("");
            }}
            disabled={busy}
          >
            Ir para operação
          </Button>
          <Button
            type="button"
            variant={targetMode === "demo" ? "primary" : "secondary"}
            onClick={() => {
              setTargetMode("demo");
              setConfirm("");
            }}
            disabled={busy}
          >
            Voltar para demo
          </Button>
        </div>

        <Input
          label={`Confirme digitando ${expectedConfirm}`}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={expectedConfirm}
          autoComplete="off"
          disabled={busy}
        />

        <Button
          type="submit"
          variant={targetMode === "operation" ? "primary" : "secondary"}
          disabled={busy || confirm.trim().toUpperCase() !== expectedConfirm}
        >
          {busy
            ? "Alternando..."
            : targetMode === "operation"
              ? "Ativar modo operação"
              : "Ativar modo demo"}
        </Button>
      </form>
    </Card>
  );
}
