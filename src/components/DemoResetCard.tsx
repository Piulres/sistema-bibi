"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import SectionHeader from "@/components/ui/SectionHeader";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { fetchJson } from "@/lib/ui/api-feedback";
import { confirmPresets } from "@/lib/ui/confirm-presets";

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
  const { isBusy, run } = useAsyncAction();

  const loadStatus = useCallback(
    () => fetchJson<DemoResetStatus>("/api/interno/demo/reset", undefined, "Erro ao carregar status do demo"),
    [],
  );

  const { data: status } = useAsyncData(loadStatus, []);

  async function handleReset() {
    await run(
      "demo-reset",
      () =>
        fetch("/api/interno/demo/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirm: "RESTAURAR" }),
        }),
      {
        confirm: confirmPresets.demoReset(),
        successMessage: "Modo demo restaurado",
        onSuccess: async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/interno/login");
          router.refresh();
        },
      },
    );
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

      <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-[var(--text-secondary)]">
        <li>Todos os cadastros, faturas, agendamentos e integrações serão substituídos</li>
        <li>Sua sessão atual será encerrada — será necessário fazer login novamente</li>
        <li>Operação irreversível (não há backup automático)</li>
      </ul>

      <div className="mt-6">
        <Button
          type="button"
          variant="danger"
          disabled={isBusy("demo-reset") || status.inProgress}
          onClick={() => void handleReset()}
        >
          {isBusy("demo-reset") || status.inProgress
            ? "Restaurando modo demo..."
            : "Restaurar estado original do seed"}
        </Button>
      </div>
    </Card>
  );
}
