"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TabBar from "@/components/ui/TabBar";
import LoadingState from "@/components/ui/LoadingState";
import CadastrosPatientsTab from "@/components/cadastros/CadastrosPatientsTab";
import type { CadastrosTabKey } from "@/components/cadastros/types";
import { useLabels } from "@/hooks/useLabels";
import { resolveCadastrosTab } from "@/lib/cadastros/resolve-tab";
import { buildCadastrosTabs } from "@/lib/navigation/niche-nav";

function tabFallback(message: string) {
  return <LoadingState message={message} />;
}

/** Abas secundárias em code-split — só baixam o chunk quando selecionadas. */
const CadastrosPetsTab = dynamic(() => import("@/components/cadastros/CadastrosPetsTab"), {
  loading: () => tabFallback("Carregando pets..."),
});
const CadastrosCompaniesTab = dynamic(() => import("@/components/cadastros/CadastrosCompaniesTab"), {
  loading: () => tabFallback("Carregando empresas..."),
});
const CadastrosProceduresTab = dynamic(
  () => import("@/components/cadastros/CadastrosProceduresTab"),
  { loading: () => tabFallback("Carregando procedimentos...") },
);
const CadastrosPricingTab = dynamic(() => import("@/components/cadastros/CadastrosPricingTab"), {
  loading: () => tabFallback("Carregando precificação..."),
});
const CadastrosProtocolsTab = dynamic(() => import("@/components/cadastros/CadastrosProtocolsTab"), {
  loading: () => tabFallback("Carregando protocolos..."),
});
const CadastrosUsersTab = dynamic(() => import("@/components/cadastros/CadastrosUsersTab"), {
  loading: () => tabFallback("Carregando usuários..."),
});
const CadastrosOperationsTab = dynamic(
  () => import("@/components/cadastros/CadastrosOperationsTab"),
  { loading: () => tabFallback("Carregando mapa CRUD...") },
);

type CadastrosViewProps = {
  /** Criar/editar usuários exige perfil ADMIN (API `requireInternoAdmin`). */
  canManageUsers?: boolean;
};

export default function CadastrosView({ canManageUsers = false }: CadastrosViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { labels, niche } = useLabels();
  const tabs = useMemo(() => buildCadastrosTabs(labels, niche), [labels, niche]);
  const tab = resolveCadastrosTab(
    searchParams.get("tab"),
    tabs.map((t) => t.key),
  );

  const selectTab = useCallback(
    (next: CadastrosTabKey) => {
      router.replace(`/interno/cadastros?tab=${next}`, { scroll: false });
    },
    [router],
  );

  return (
    <div className="space-y-6">
      <TabBar
        tabs={tabs.map((t) => ({ key: t.key, label: t.label }))}
        active={tab}
        onSelect={(key) => selectTab(key as CadastrosTabKey)}
      />

      {tab === "patients" && <CadastrosPatientsTab />}
      {tab === "pets" && <CadastrosPetsTab />}
      {tab === "companies" && <CadastrosCompaniesTab />}
      {tab === "procedures" && <CadastrosProceduresTab />}
      {tab === "pricing" && <CadastrosPricingTab />}
      {tab === "protocols" && <CadastrosProtocolsTab />}
      {tab === "users" && <CadastrosUsersTab canManageUsers={canManageUsers} />}
      {tab === "operations" && <CadastrosOperationsTab />}
    </div>
  );
}
