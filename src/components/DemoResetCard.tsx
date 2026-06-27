"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import SectionHeader from "@/components/ui/SectionHeader";
import Input from "@/components/ui/Input";

type DemoResetStatus = {
  enabled: boolean;
  canReset: boolean;
  inProgress: boolean;
};

type Props = {
  isAdmin: boolean;
};

export default function DemoResetCard({ isAdmin }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<DemoResetStatus | null>(null);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/interno/demo/reset");
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

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/interno/demo/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: confirm.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao restaurar modo demo");
        return;
      }
      setSuccess(data.message ?? "Modo demo restaurado");
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/interno/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin || !status?.enabled) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50" data-tour-id="demo-reset">
      <SectionHeader
        title="Modo demo — restaurar dados"
        description="Apaga todos os dados e repopula o banco com a massa original do seed (50 clientes, fluxos demo, VitaCare). Use antes de apresentações ou após testes."
      />

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
        <li>Todos os cadastros, faturas, agendamentos e integrações serão substituídos</li>
        <li>Sua sessão atual será encerrada — será necessário fazer login novamente</li>
        <li>Operação irreversível (não há backup automático)</li>
      </ul>

      <form onSubmit={handleReset} className="mt-6 space-y-4">
        <Input
          label='Confirme digitando RESTAURAR'
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="RESTAURAR"
          autoComplete="off"
          disabled={busy || status.inProgress}
        />
        <Button
          type="submit"
          variant="danger"
          disabled={busy || status.inProgress || confirm.trim().toUpperCase() !== "RESTAURAR"}
        >
          {busy ? "Restaurando modo demo..." : "Restaurar estado original do seed"}
        </Button>
      </form>
    </Card>
  );
}
