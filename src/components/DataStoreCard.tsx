"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import SectionHeader from "@/components/ui/SectionHeader";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { fetchJson } from "@/lib/ui/api-feedback";
import { confirmPresets } from "@/lib/ui/confirm-presets";

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
  const { isBusy, run } = useAsyncAction();
  const [targetMode, setTargetMode] = useState<"demo" | "operation">("operation");

  const loadStatus = useCallback(
    () => fetchJson<DataStoreStatus>("/api/interno/data-store", undefined, "Erro ao carregar modo de dados"),
    [],
  );

  const { data: status, reload } = useAsyncData(loadStatus, []);

  async function handleSwitch(mode: "demo" | "operation") {
    const targetLabel = mode === "operation" ? "Operação (real)" : "Demo (teste)";
    const confirmPhrase = mode === "operation" ? "OPERAR" : "DEMO";

    await run(
      `switch-${mode}`,
      () =>
        fetch("/api/interno/data-store", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, confirm: confirmPhrase }),
        }),
      {
        confirm: confirmPresets.switchDataStore(targetLabel),
        successMessage: `Modo ${targetLabel} ativado`,
        onSuccess: async (body) => {
          await reload();
          if (body.logoutRecommended) {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/interno/login");
            router.refresh();
          }
        },
      },
    );
  }

  if (!isAdmin || !status?.canSwitch) {
    return null;
  }

  const isDemo = status.mode === "demo";

  return (
    <Card className="border-teal-200 bg-teal-50/40" data-tour-id="data-store-mode">
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

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          type="button"
          variant={targetMode === "operation" ? "primary" : "secondary"}
          onClick={() => setTargetMode("operation")}
          disabled={isBusy("switch-operation")}
        >
          Ir para operação
        </Button>
        <Button
          type="button"
          variant={targetMode === "demo" ? "primary" : "secondary"}
          onClick={() => setTargetMode("demo")}
          disabled={isBusy("switch-demo")}
        >
          Voltar para demo
        </Button>
        <Button
          type="button"
          variant={targetMode === "operation" ? "primary" : "secondary"}
          disabled={isBusy(`switch-${targetMode}`)}
          onClick={() => void handleSwitch(targetMode)}
        >
          {isBusy(`switch-${targetMode}`)
            ? "Alternando..."
            : targetMode === "operation"
              ? "Ativar modo operação"
              : "Ativar modo demo"}
        </Button>
      </div>
    </Card>
  );
}
